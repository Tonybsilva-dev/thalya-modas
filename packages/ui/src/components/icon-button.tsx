import * as React from "react";

import { Button, type ButtonProps } from "./button";

type IconButtonProps = Omit<ButtonProps, "size" | "children"> & {
  children: React.ReactNode;
};

function IconButton({ "aria-label": ariaLabel, ...props }: IconButtonProps) {
  return <Button aria-label={ariaLabel} size="icon" {...props} />;
}

export { IconButton };
export type { IconButtonProps };
