import { useHealthCheck } from "@/hooks/useHealthCheck";

function StatusIndicator({
  ok,
  label,
}: {
  ok: boolean | null;
  label: string;
}) {
  if (ok === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-sm text-muted-foreground">{label}: checking...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
      />
      <span className="text-sm text-muted-foreground">
        {label}:{" "}
        <span className={ok ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {ok ? "connected" : "unavailable"}
        </span>
      </span>
    </div>
  );
}

export default function App() {
  const { status, data, error, refetch } = useHealthCheck();

  const isLoading = status === "idle" || status === "loading";
  const apiOk = status === "success" && data?.status === "ok";
  const dbOk = status === "success" && data?.db_connection === "success";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Pro-Gas ERP
        </h1>
        <p className="mt-2 text-muted-foreground">
          Internal Inventory &amp; Cash Management System
        </p>
      </div>

      {/* Status Card */}
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
          System Status
        </h2>

        <div className="flex flex-col gap-3">
          <StatusIndicator
            ok={isLoading ? null : apiOk}
            label="API Server"
          />
          <StatusIndicator
            ok={isLoading ? null : dbOk}
            label="Database"
          />
        </div>

        {error && (
          <p className="mt-4 text-xs text-destructive break-words">
            Error: {error}
          </p>
        )}

        <button
          onClick={refetch}
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? "Checking..." : "Retry"}
        </button>
      </div>

      {/* Raw response for debugging */}
      {data && (
        <div className="w-full max-w-sm">
          <p className="mb-1 text-xs text-muted-foreground">Raw API response:</p>
          <pre className="rounded-md bg-muted p-3 text-xs text-muted-foreground overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
