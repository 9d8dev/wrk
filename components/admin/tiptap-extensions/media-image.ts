import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export interface MediaImageOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaImage: {
      /**
       * Add an image with media attributes
       */
      setMediaImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        mediaId?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const MediaImage = Image.extend<MediaImageOptions>({
  name: "mediaImage",

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: "rounded-md max-w-full",
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes) => {
          if (!attributes.mediaId) {
            return {};
          }

          return {
            "data-media-id": attributes.mediaId,
          };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }

          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }

          return {
            height: attributes.height,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setMediaImage:
        (options: {
          src: string;
          alt?: string;
          title?: string;
          mediaId?: string;
          width?: number;
          height?: number;
        }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string | number | boolean> }) {
    const { mediaId, ...rest } = HTMLAttributes;

    return [
      "img",
      mergeAttributes(
        this.options.HTMLAttributes,
        rest,
        mediaId ? { "data-media-id": mediaId } : {}
      ),
    ];
  },
});

export default MediaImage;
