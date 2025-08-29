import { environmentVariable } from "../config";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import z from "zod";
import { v4 as uuidv4 } from "uuid";

import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { APICore } from "../api/apiCore";
import { SignalRMethods } from "../enums/SignalRMethods";
import type { CancelRequest } from "../types";

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
  const idempotencyKeyRef = useRef<string>("");

  var api = new APICore();

  useEffect(() => {
    if (!isProcessing) {
      idempotencyKeyRef.current = uuidv4();
    }
  }, [isProcessing]);

  let totalCharactersReceived = 0;

  //SignalR connection and event handlers
  useEffect(() => {
    const initConnection = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(`${environmentVariable.VITE_API_URL}/notifications`, {
          accessTokenFactory: () => api.getUserToken(),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
        .build();

      //get the total length of characters to be received
      connection.on(SignalRMethods.MessageLength, (totalLength: number) => {
        if (totalLength > 0) {
          messageLengthRef.current = totalLength;
        }
      });

      //append the received characters to the text area
      connection.on(SignalRMethods.ReceiveNotification, (message: string) => {
        setReceivedString((prev) => prev + message);
        totalCharactersReceived++;
        setProgressBar(
          Math.floor((totalCharactersReceived * 100) / messageLengthRef.current)
        );
      });

      //processing has been completed
      connection.on(SignalRMethods.ProcessingCompleted, () => {
        totalCharactersReceived = 0;
        setProgressBar(100);
        setIsProcessing(false);
        reset();
      });

      //processing has been cancelled
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
        console.log("Connection successful");
        connectionRef.current = connection;
      } catch (error) {
        console.error("Connection failed: ", error);
      } finally {
        //console.clear();
      }
    };

    initConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const handleCancellation = async () => {
    if (backgroundJobId && isProcessing) {
      try {
        const data: CancelRequest = {
          jobId: backgroundJobId.toString(),
        };

        await api.postAsync(
          `${environmentVariable.VITE_API_URL}/api/processor/cancel-job`,
          data
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
    setIsProcessing(true);
    setReceivedString("");

    try {
      const response = await axios.post(
        `${environmentVariable.VITE_API_URL}/api/processor/process-string`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKeyRef.current,
          },
        }
      );

      if (response.status === 400) {
        toast.error(
          "Invalid request. Please check your input and ensure you're not sending more than one request at a time"
        );
      }

      if (response.data.isSuccess) {
        setBackgroundJobId(response.data.value);
      }
    } catch (error) {
      setIsProcessing(false);
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
