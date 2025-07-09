"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PostHogStatus {
  isInitialized: boolean;
  hasKey: boolean;
  hasHost: boolean;
  distinctId: string | null;
  sessionId: string | null;
  isIdentified: boolean;
  lastEvent: string | null;
}

export function PostHogDebug() {
  const posthog = usePostHog();
  const [status, setStatus] = useState<PostHogStatus>({
    isInitialized: false,
    hasKey: false,
    hasHost: false,
    distinctId: null,
    sessionId: null,
    isIdentified: false,
    lastEvent: null,
  });

  useEffect(() => {
    const checkStatus = () => {
      const hasKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const hasHost = !!process.env.NEXT_PUBLIC_POSTHOG_HOST;

      if (posthog) {
        try {
          const distinctId = posthog.get_distinct_id();
          const sessionId = posthog.get_session_id();
          const isIdentified = posthog.get_property("$is_identified") === true;

          setStatus({
            isInitialized: true,
            hasKey,
            hasHost,
            distinctId,
            sessionId,
            isIdentified,
            lastEvent: null,
          });
        } catch (error) {
          console.error("PostHog status check error:", error);
          setStatus((prev) => ({
            ...prev,
            isInitialized: false,
            hasKey,
            hasHost,
          }));
        }
      } else {
        setStatus((prev) => ({
          ...prev,
          isInitialized: false,
          hasKey,
          hasHost,
        }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [posthog]);

  const testEvents = [
    {
      name: "Test Pageview",
      event: "$pageview",
      properties: { test: true, timestamp: new Date().toISOString() } as Record<
        string,
        string | number | boolean
      >,
    },
    {
      name: "Test Custom Event",
      event: "debug_test_event",
      properties: { test: true, timestamp: new Date().toISOString() } as Record<
        string,
        string | number | boolean
      >,
    },
    {
      name: "Test User Identification",
      event: "$identify",
      properties: { test_user: true } as Record<
        string,
        string | number | boolean
      >,
    },
  ];

  const sendTestEvent = (
    eventName: string,
    properties: Record<string, string | number | boolean>
  ) => {
    if (posthog) {
      if (eventName === "$identify") {
        posthog.identify("test_user_" + Date.now(), properties);
      } else {
        posthog.capture(eventName, properties);
      }
      setStatus((prev) => ({ ...prev, lastEvent: eventName }));
      console.log("Sent test event:", eventName, properties);
    }
  };

  const resetPostHog = () => {
    if (posthog) {
      posthog.reset();
      console.log("PostHog reset");
    }
  };

  // Only show in development or for admin users
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="bg-background fixed right-4 bottom-4 z-50 w-96 border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">PostHog Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Status</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${status.hasKey ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>API Key</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${status.hasHost ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>Host</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${status.isInitialized ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>Initialized</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${status.isIdentified ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <span>Identified</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Info</h4>
          <div className="space-y-1 text-xs">
            <div>Distinct ID: {status.distinctId || "None"}</div>
            <div>Session ID: {status.sessionId || "None"}</div>
            <div>Last Event: {status.lastEvent || "None"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Events</h4>
          <div className="space-y-2">
            {testEvents.map((test) => (
              <Button
                key={test.name}
                variant="outline"
                size="sm"
                onClick={() => sendTestEvent(test.event, test.properties)}
                disabled={!status.isInitialized}
                className="w-full justify-start text-xs"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Actions</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={resetPostHog}
            disabled={!status.isInitialized}
            className="w-full text-xs"
          >
            Reset PostHog
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
