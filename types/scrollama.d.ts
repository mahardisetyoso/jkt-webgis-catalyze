declare module "scrollama" {
  interface StepResponse {
    element: Element;
    index: number;
    direction: "up" | "down";
  }
  interface ScrollamaInstance {
    setup(options: {
      step: string;
      offset?: number;
      progress?: boolean;
      [key: string]: unknown;
    }): ScrollamaInstance;
    onStepEnter(cb: (response: StepResponse) => void): ScrollamaInstance;
    onStepExit(cb: (response: StepResponse) => void): ScrollamaInstance;
    resize(): ScrollamaInstance;
    destroy(): void;
  }
  export default function scrollama(): ScrollamaInstance;
}
