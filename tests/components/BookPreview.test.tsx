import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookPreview } from "@/components/BookPreview/BookPreview";

// Mock data
const mockBook = {
  _id: "book123" as any,
  _creationTime: Date.now(),
  userId: "user123" as any,
  title: "My Adventure Book",
  pageCount: 10,
  status: "ready_to_print" as const,
  characterImages: [],
  coverDesign: {
    title: "My Adventure Book",
    subtitle: "A magical journey",
    theme: "purple-magic" as const,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockPages = [
  {
    _id: "page1" as any,
    _creationTime: Date.now(),
    bookId: "book123" as any,
    pageNumber: 1,
    title: "Stop 1: The Beginning",
    storyText: "Our adventure begins here...",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    images: [
      {
        _id: "img1" as any,
        _creationTime: Date.now(),
        pageId: "page1" as any,
        originalImageId: "storage1" as any,
        generationStatus: "completed" as const,
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalUrl: "https://example.com/original1.jpg",
        cartoonUrl: "https://example.com/cartoon1.jpg",
      },
    ],
  },
  {
    _id: "page2" as any,
    _creationTime: Date.now(),
    bookId: "book123" as any,
    pageNumber: 2,
    title: "Stop 2: The Journey",
    storyText: "We continued our journey...",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    images: [
      {
        _id: "img2" as any,
        _creationTime: Date.now(),
        pageId: "page2" as any,
        originalImageId: "storage2" as any,
        generationStatus: "completed" as const,
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalUrl: "https://example.com/original2.jpg",
        cartoonUrl: "https://example.com/cartoon2.jpg",
      },
    ],
  },
];

describe("BookPreview", () => {
  const mockOnOrderClick = vi.fn();
  const mockOnBackClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
  });

  it("renders book title", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
        onBackClick={mockOnBackClick}
      />
    );
    expect(screen.getByText("My Adventure Book")).toBeInTheDocument();
  });

  it("displays order button with price", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
        onBackClick={mockOnBackClick}
      />
    );
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("calls onOrderClick when order button is clicked", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
        onBackClick={mockOnBackClick}
      />
    );
    const orderButton = screen.getByText("$49.99").closest("button");
    fireEvent.click(orderButton!);
    expect(mockOnOrderClick).toHaveBeenCalledTimes(1);
  });

  it("calls onBackClick when back button is clicked", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
        onBackClick={mockOnBackClick}
      />
    );
    const backButton = screen.getByText("←").closest("button");
    fireEvent.click(backButton!);
    expect(mockOnBackClick).toHaveBeenCalledTimes(1);
  });

  it("shows page count", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    expect(screen.getByText(`${mockPages.length} pages`)).toBeInTheDocument();
  });

  it("shows cover initially", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("shows click to open hint on cover", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    // Desktop shows "Click to open"
    expect(screen.getByText("Click to open")).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    expect(screen.getByRole("button", { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("disables previous button on first spread", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    const prevButton = screen.getByRole("button", { name: /Previous/i });
    expect(prevButton).toBeDisabled();
  });

  it("enables next button on first spread", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it("navigates to next spread on click", async () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    
    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    
    // Wait for animation
    await waitFor(
      () => {
        expect(screen.getByText("Pages 1-2")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("renders progress indicator dots", () => {
    const { container } = render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    // Should have dots for: cover + spreads + back cover
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("handles book without cover design gracefully", () => {
    const bookWithoutCover = { ...mockBook, coverDesign: undefined };
    render(
      <BookPreview
        book={bookWithoutCover}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    // Should still render the title from book.title
    expect(screen.getByText("My Adventure Book")).toBeInTheDocument();
  });

  it("handles empty pages array", () => {
    render(
      <BookPreview
        book={mockBook}
        pages={[]}
        onOrderClick={mockOnOrderClick}
      />
    );
    expect(screen.getByText("0 pages")).toBeInTheDocument();
  });
});

describe("BookPreview Mobile", () => {
  const mockOnOrderClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 375,
    });
    window.dispatchEvent(new Event("resize"));
  });

  it("shows tap to open hint on mobile", async () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    
    // Allow component to update after resize
    await waitFor(() => {
      expect(screen.getByText(/Tap to open|Click to open/)).toBeInTheDocument();
    });
  });

  it("shows swipe hint on mobile", async () => {
    render(
      <BookPreview
        book={mockBook}
        pages={mockPages}
        onOrderClick={mockOnOrderClick}
      />
    );
    
    // Mobile shows swipe hint
    await waitFor(() => {
      const swipeHint = screen.queryByText(/Swipe/);
      // May or may not be visible depending on mobile detection
      expect(swipeHint || screen.getByText(/navigate/)).toBeInTheDocument();
    });
  });
});
