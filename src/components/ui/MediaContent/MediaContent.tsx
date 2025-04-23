// components/ui/MediaContent.tsx

import React from "react";

type Media = {
  type: "image" | "video";
  url: string;
  alt?: string;
};

type MediaContentOptions = {
  imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
};

type MediaContentProps = {
  media: Media;
  options?: MediaContentOptions;
};

export default function MediaContent({ media, options = {} }: MediaContentProps) {
  const { type, url, alt } = media;

  if (type === "image") {
    return (
      <img
        src={url}
        alt={alt || ""}
        {...options.imageProps}
      />
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        {...options.videoProps}
      />
    );
  }

  return null;
}
