import { environmentVariable } from "../config";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import z from "zod";

import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { APICore } from "../api/apiCore";
import { SignalRMethods } from "../enums/SignalRMethods";

const schema = z.object({
  input: z
    .string()
    .nonempty()
    .min(2, { message: "Input must be at least 2 characters long" })
    .max(50, { message: "Input can't be more than 50 characters long" })
    .refine((val) => val.trim() !== "", {
      message: "Input string can't be empty or white space",
    }),
});

type ProcessStringRequest = z.infer<typeof schema>;

export default function ProcessStringPage() {
  const [receivedString, setReceivedString] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [progressBar, setProgressBar] = useState<number>(0);

  const [backgroundJobId, setBackgroundJobId] = useState<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);

  const messageLengthRef = useRef<number>(0);

  var api = new APICore();

  let totalCharactersReceived = 0;
  //connect to SignalR
  useEffect(() => {
    const initConnection = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(`${environmentVariable.VITE_API_URL}/notifications`, {
          accessTokenFactory: () => api.getUserToken(),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
        .build();

      connection.on(SignalRMethods.MessageLength, (totalLength: number) => {
        if (totalLength > 0) {
          messageLengthRef.current = totalLength;
        }
      });

      connection.on(SignalRMethods.ReceiveNotification, (message: string) => {
        setReceivedString((prev) => prev + message);
        totalCharactersReceived++;
        setProgressBar(
          Math.floor((totalCharactersReceived * 100) / messageLengthRef.current)
        );
      });

      connection.on(SignalRMethods.ProcessingCompleted, () => {
        totalCharactersReceived = 0;
        setProgressBar(100);
        setIsProcessing(false);
        reset();
      });

      connection.on(SignalRMethods.ProcessingCancelled, () => {
        totalCharactersReceived = 0;
        setProgressBar(0);
        setReceivedString("");
        setIsProcessing(false);
        reset();
        toast.error("Processing cancelled");
      });

      try {
        await connection.start();
        console.log("SignalR connection successful.");
        connectionRef.current = connection;
      } catch (error) {
        console.error("SignalR connection failed:", error);
      }
    };

    initConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  type CancelRequest = {
    jobId: string;
  };

  const handleCancellation = async () => {
    if (backgroundJobId) {
      try {
        const data: CancelRequest = {
          jobId: backgroundJobId.toString(),
        };

        await axios.post(
          `${environmentVariable.VITE_API_URL}/api/processor/cancel-job`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        setError("root", {
          type: "manual",
          message: String("An error while processing the string"),
        });
      }
    }
  };

  //used zod + react-hook-form for form processing
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProcessStringRequest>({
    resolver: zodResolver(schema),
  });

  const processString: SubmitHandler<ProcessStringRequest> = async (data) => {
    setReceivedString("");
    setIsProcessing(true);

    try {
      const response = await api.postAsync(
        `${environmentVariable.VITE_API_URL}/api/processor/process-string`,
        data
      );

      if (response.data.isSuccess) {
        setBackgroundJobId(response.data.value);
      }
    } catch (error) {
      setError("root", {
        type: "manual",
        message: String("An error occured while processing the string"),
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <ToastContainer />

      <div className="card shadow p-4" style={{ width: "400px" }}>
        <div className="card-body">
          <h4 className="card-title text-center mb-4">
            Generate random strings
          </h4>
          <form onSubmit={handleSubmit(processString)}>
            <div className="form-group mb-3">
              <input
                {...register("input")}
                className="form-control"
                type="text"
                placeholder="Enter your input string"
              />
              {errors.input && (
                <small className="text-danger">{errors.input.message}</small>
              )}
            </div>

            <button
              disabled={isProcessing}
              type="submit"
              className="btn w-100 btn-success"
              style={{
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? "Processing..." : "Process"}
            </button>

            {errors.root && (
              <div className="text-danger mt-3">{errors.root.message}</div>
            )}
          </form>

          <textarea
            readOnly
            value={receivedString}
            className="form-control mt-3"
            style={{ height: "150px" }}
          />
          <button
            disabled={!isProcessing}
            type="button"
            onClick={handleCancellation}
            className="btn btn-danger w-100 mt-3"
          >
            Cancel
          </button>
          <div
            className="progress mt-3"
            role="progressbar"
            aria-label="Example with label"
            aria-valuenow={progressBar}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-success"
              style={{ width: `${progressBar}%` }}
            >
              {progressBar}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
