import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationProps {
  itemCount: number;
  columns: number;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onSelect: (index: number) => void;
  onFavorite?: (index: number) => void;
}

export function useKeyboardNavigation({
  itemCount,
  columns,
  focusedIndex,
  onFocusChange,
  onSelect,
  onFavorite,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (itemCount === 0) return;

      const rows = Math.ceil(itemCount / columns);
      const currentRow = Math.floor(focusedIndex / columns);
      const currentCol = focusedIndex % columns;

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          if (currentRow > 0) {
            const newIndex = (currentRow - 1) * columns + currentCol;
            onFocusChange(Math.min(newIndex, itemCount - 1));
          }
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          if (currentRow < rows - 1) {
            const newIndex = (currentRow + 1) * columns + currentCol;
            onFocusChange(Math.min(newIndex, itemCount - 1));
          }
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          if (focusedIndex > 0) {
            onFocusChange(focusedIndex - 1);
          }
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          if (focusedIndex < itemCount - 1) {
            onFocusChange(focusedIndex + 1);
          }
          break;
        }
        case 'Enter': {
          event.preventDefault();
          onSelect(focusedIndex);
          break;
        }
        case 'f':
        case 'F': {
          event.preventDefault();
          if (onFavorite) {
            onFavorite(focusedIndex);
          }
          break;
        }
      }
    },
    [itemCount, columns, focusedIndex, onFocusChange, onSelect, onFavorite]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook to scroll focused element into view
export function useScrollIntoView(
  focusedIndex: number,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    const element = itemRefs.current.get(focusedIndex);
    if (element && containerRef.current) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [focusedIndex, containerRef]);

  const setItemRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  return { setItemRef };
}
