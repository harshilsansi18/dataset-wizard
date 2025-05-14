
import * as React from "react";
import {
  toast as sonnerToast,
  Toaster as SonnerToaster,
} from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export interface ToastProps {
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

export type ToastActionElement = React.ReactElement<{
  altText?: string;
  icon?: React.ReactNode;
  title?: string;
  onClick?: () => void;
  href?: string;
}>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

type ToastActionType = {
  altText?: string;
  icon?: React.ReactNode;
  title?: string;
} & (
  | {
      onClick: () => void;
      href?: never;
    }
  | {
      onClick?: never;
      href: string;
    }
);

export type ToastType = Omit<ToastProps, "children"> & {
  action?: ToastActionType;
  description?: React.ReactNode;
  title: React.ReactNode;
};

export function toast({
  title,
  description,
  variant = "default",
  action,
  ...props
}: ToastType) {
  return sonnerToast(title, {
    description,
    action: action
      ? {
          label: action.title || "Action",
          onClick: action.onClick,
          href: action.href,
        }
      : undefined,
    classNames: {
      toast: variant === "destructive" ? "destructive" : "",
    },
    ...props,
  });
}

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (title: string, description?: string) =>
      toast({ title, description, variant: "destructive" }),
    success: (title: string, description?: string) =>
      toast({ title, description }),
  };
};
