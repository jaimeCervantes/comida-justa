import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import classNames from "classnames";
import type { ReactNode, ForwardedRef } from "react";

export default React.forwardRef(function ListItem(
  {
    className,
    children,
    title,
    href,
    ...props
  }: { className?: string; children: ReactNode; href: string; title: string },
  forwardedRef: ForwardedRef<HTMLAnchorElement>
) {
  return (
    <li>
      <NavigationMenu.Link asChild>
        <a
          className={classNames(
            "group focus:shadow-[0_0_0_2px] focus:shadow-violet7 hover:bg-mauve3 hover:text-pw-black block select-none rounded-[6px] p-3 text-[15px] leading-none no-underline outline-none transition-colors",
            className
          )}
          href={href}
          {...props}
          ref={forwardedRef}
        >
          <div className="text-violet12 dark:text-pw-white group-hover:text-pw-black mb-[5px] font-medium leading-[1.2]">
            {title}
          </div>
          <p className="text-mauve11 dark:text-pw-white group-hover:text-pw-black leading-[1.4]">
            {children}
          </p>
        </a>
      </NavigationMenu.Link>
    </li>
  );
});
