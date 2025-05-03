"use client";

import React, {
  useEffect,
  useRef,
  useState,
  ReactElement,
  CSSProperties,
} from "react";
import styles from "./masonary.module.css";

interface MasonryItemPosition {
  colIdx: number;
  top: number;
}

interface ReactElementWithProps extends ReactElement {
  props: {
    style?: CSSProperties;
    className?: string;
    [key: string]: unknown;
  };
}

export const MasonryGrid = ({
  children,
  gap = 10,
}: {
  children: React.ReactNode;
  gap?: number;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [gridHeight, setGridHeight] = useState("auto");
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);
  const [itemPositions, setItemPositions] = useState<MasonryItemPosition[]>([]);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate number of columns based on grid width
  const calculateColumns = () => {
    if (!gridRef.current) return 4;
    const width = gridRef.current.offsetWidth;

    if (width > 800) return 4;
    if (width > 500) return 3;
    if (width > 300) return 2;
    return 1;
  };

  // Calculate layout of all items
  const calculateLayout = () => {
    if (!gridRef.current || !isImagesLoaded) return;

    const cols = calculateColumns();
    setColumns(cols);

    const colHeights = Array(cols).fill(0);
    const colBlockCounts = Array(cols).fill(0);
    const positions: MasonryItemPosition[] = [];

    // Get all direct children elements for measurement
    const childrenElements = Array.from(gridRef.current.children);

    childrenElements.forEach((child, index) => {
      // Find the column with minimum height
      const min = Math.min(...colHeights);
      const colIdx = colHeights.indexOf(min);

      // Calculate top position
      const top = min + gap * (colBlockCounts[colIdx] - 1);

      // Update positions array
      positions[index] = {
        colIdx,
        top: top,
      };

      // Update column block count
      colBlockCounts[colIdx]++;

      // Update column height
      colHeights[colIdx] += (child as HTMLElement).offsetHeight;
    });

    // Update item positions state
    setItemPositions(positions);

    // Update grid height to match tallest column
    setGridHeight(`${Math.max(...colHeights)}px`);
  };

  // Handle window resize
  const handleResize = () => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    layoutTimeoutRef.current = setTimeout(() => {
      calculateLayout();
      layoutTimeoutRef.current = null;
    }, 20);
  };

  // Initialize layout and add event listeners
  useEffect(() => {
    const handleImagesLoaded = async () => {
      if (!gridRef.current) return;

      const images = Array.from(gridRef.current.querySelectorAll("img"));

      // If no images, calculate layout directly
      if (images.length === 0) {
        setIsImagesLoaded(true);
        return;
      }

      // Wait for all images to load
      await Promise.all(
        images.map((img) => {
          return new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve even on error to continue layout
          });
        })
      );

      setIsImagesLoaded(true);
    };

    handleImagesLoaded();

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, []);

  // Calculate layout when images are loaded or children change
  useEffect(() => {
    if (isImagesLoaded) {
      calculateLayout();
    }
  }, [isImagesLoaded, children, gap]);

  // Calculate column width based on number of columns and gap
  const getColumnWidth = () => {
    return `calc(100% / ${columns} - ${gap}px * (${columns} - 1) / ${columns})`;
  };

  return (
    <div
      ref={gridRef}
      className={styles.masonryGrid}
      style={
        {
          height: gridHeight,
          "--default-gap": `${gap}px`,
        } as React.CSSProperties
      }
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const typedChild = child as ReactElementWithProps;
        const position = itemPositions[index] || { colIdx: 0, top: 0 };
        const columnWidth = getColumnWidth();

        // Clone the child element with position styles
        return React.cloneElement(typedChild, {
          style: {
            ...typedChild.props.style,
            width: columnWidth,
            left: `calc(${columnWidth} * ${position.colIdx} + ${gap}px * ${position.colIdx})`,
            top: `${position.top}px`,
            visibility: isImagesLoaded ? "visible" : "hidden",
            position: "absolute",
            display: "block",
          },
          className: `${styles.masonryItem} ${
            typedChild.props.className || ""
          }`,
        });
      })}
    </div>
  );
};
