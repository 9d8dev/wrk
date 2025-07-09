"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePostHogEvents } from "@/components/analytics";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createLead } from "@/lib/actions/leads";

// Schema and defaults outside component for clarity
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" }),
});

const defaultValues = {
  name: "",
  email: "",
  message: "",
};

type FormValues = z.infer<typeof formSchema>;

type ContactFormProps = {
  userId: string;
  portfolioOwner?: string;
};

export function ContactForm({ userId, portfolioOwner }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { trackContactFormSubmission } = usePostHogEvents();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleReset = () => {
    setSuccess(false);
    form.reset();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createLead({ userId, ...data });
      if (result.success) {
        setSuccess(true);
        toast.success("Message sent successfully");
        portfolioOwner && trackContactFormSubmission(portfolioOwner, true);
        form.reset();
      } else {
        toast.error("Failed to send message");
        portfolioOwner && trackContactFormSubmission(portfolioOwner, false);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-accent/50 space-y-4 rounded-sm border p-6">
        <CheckCircle className="text-green-500" />
        <h3 className="font-medium">Message Sent!</h3>
        <p className="text-muted-foreground">
          Thank you for reaching out. I&apos;ll respond as soon as possible.
        </p>
        <Button variant="outline" onClick={handleReset}>
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-accent/30 space-y-4 rounded border p-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contact-name">Name</FormLabel>
              <FormControl>
                <Input id="contact-name" placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contact-email">Email</FormLabel>
              <FormControl>
                <Input
                  id="contact-email"
                  placeholder="your.email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contact-message">Message</FormLabel>
              <FormControl>
                <Textarea
                  id="contact-message"
                  placeholder="How can I help you?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Form>
  );
}
