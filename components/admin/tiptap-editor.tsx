"use client";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { uploadImage } from "@/lib/actions/media";
import { Media } from "@/types";
import MediaImage from "./tiptap-extensions/media-image";

import "./tiptap.css";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  maxImages?: number;
  projectId?: string;
  onMediaAdded?: (media: Media) => void;
}

export const TiptapEditor = ({
  content,
  onChange,
  maxImages = 5,
  projectId,
  onMediaAdded,
}: TiptapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageCount, setImageCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write about your project, add up to 5 images",
      }),
      MediaImage.configure({
        HTMLAttributes: {
          class: "rounded max-w-full",
        },
      }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      // Count images in editor content
      countImagesInContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "w-full h-full min-h-[200px] focus:outline-none p-4",
      },
    },
  });

  // Count images in HTML content
  const countImagesInContent = (htmlContent: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const imgTags = tempDiv.querySelectorAll("img");
    setImageCount(imgTags.length);
  };

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "<p></p>");
      // Count initial images when content is set
      countImagesInContent(content || "<p></p>");
    }
  }, [content, editor]);

  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    // Check if image limit is reached
    if (imageCount >= maxImages) {
      alert(`You can only add up to ${maxImages} images.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload the image and store in media table
      const result = await uploadImage(formData, projectId);

      if (result.success) {
        // Insert the image into the editor with media attributes
        editor
          .chain()
          .focus()
          .setMediaImage({
            src: result.url,
            alt: file.name,
            mediaId: result.mediaId,
            width: result.width,
            height: result.height,
          })
          .run();

        // Update image count after adding
        setImageCount((prev) => prev + 1);

        // Create media object and notify parent component
        if (result.mediaId) {
          const newMedia: Media = {
            id: result.mediaId,
            url: result.url,
            width: result.width,
            height: result.height,
            alt: file.name,
            size: file.size,
            mimeType: file.type,
            projectId: projectId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Notify parent component about the new media
          if (onMediaAdded) {
            onMediaAdded(newMedia);
          }
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageButtonClick = () => {
    // Check if image limit is reached before opening file picker
    if (imageCount >= maxImages) {
      alert(`You can only add up to ${maxImages} images.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded">
      <div className="flex flex-wrap gap-1 p-px border-b bg-muted/50">
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={
            editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("code") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleImageButtonClick}
          disabled={imageCount >= maxImages}
          title={
            imageCount >= maxImages
              ? `Maximum of ${maxImages} images reached`
              : "Insert image"
          }
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
        {maxImages > 0 && (
          <span className="ml-auto mr-3 text-xs text-muted-foreground self-center">
            {imageCount}/{maxImages} images
          </span>
        )}
      </div>
      <EditorContent
        editor={editor}
        className="w-full h-full text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
};
