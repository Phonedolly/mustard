"use client";

/* WorkflowStepper - 4-step workflow progress indicator */

import { Card, CardContent } from "@/components/ui/card";

export type WorkflowStep =
  | "keywords"
  | "story"
  | "images"
  | "placement";

interface StepConfig {
  id: WorkflowStep;
  label: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: "keywords",
    label: "1. Keywords",
    description: "Configure story generation keywords",
  },
  {
    id: "story",
    label: "2. Story",
    description: "Generate and split into scenes",
  },
  {
    id: "images",
    label: "3. Images",
    description: "Upload images for placement",
  },
  {
    id: "placement",
    label: "4. Placement",
    description: "View and adjust image placements",
  },
];

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  onStepClick?: (step: WorkflowStep) => void;
}

export function WorkflowStepper({
  currentStep,
  completedSteps,
  onStepClick,
}: WorkflowStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = step.id === currentStep;
              const isClickable =
                isCompleted || index <= currentIndex || onStepClick;

              return (
                <div
                  key={step.id}
                  className={`
                    flex flex-col items-center text-center
                    ${isClickable ? "cursor-pointer" : "cursor-default"}
                  `}
                  onClick={() => {
                    if (isClickable && onStepClick) {
                      onStepClick(step.id);
                    }
                  }}
                >
                  {/* Step Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      text-sm font-medium transition-all duration-200
                      ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {isCompleted ? (
                      /* Checkmark for completed */
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`
                      mt-2 text-sm font-medium
                      ${isCurrent ? "text-primary" : "text-muted-foreground"}
                    `}
                  >
                    {step.label}
                  </span>

                  {/* Step Description (only on larger screens) */}
                  <span className="hidden md:block mt-1 text-xs text-muted-foreground max-w-[120px]">
                    {step.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/*
 * Helper hook for managing workflow state.
 * Can be used by parent components to track progress.
 */
export function useWorkflowState(initialStep: WorkflowStep = "keywords") {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(
    new Set()
  );

  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      completeStep(currentStep);
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const reset = () => {
    setCurrentStep("keywords");
    setCompletedSteps(new Set());
  };

  return {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    reset,
  };
}

/* Import useState for the hook */
import { useState } from "react";
