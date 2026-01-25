import { describe, it, expect } from "vitest";
import {
  PRINT_SPECS,
  getSpineWidth,
  getCoverDimensions,
  calculatePrintedPageCount,
  analyzeImageForPrint,
  generateBookStructure,
  STOP_OPTIONS,
  US_STATES,
  LULU_POD_PACKAGE_ID,
} from "@/lib/printSpecs";

describe("Print Specifications", () => {
  describe("PRINT_SPECS constants", () => {
    it("has correct trim dimensions", () => {
      expect(PRINT_SPECS.trimWidth).toBe(8.5);
      expect(PRINT_SPECS.trimHeight).toBe(8.5);
    });

    it("has correct bleed and safety margins", () => {
      expect(PRINT_SPECS.bleed).toBe(0.125);
      expect(PRINT_SPECS.safetyMargin).toBe(0.25);
    });

    it("calculates interior dimensions with bleed", () => {
      expect(PRINT_SPECS.interiorWidth).toBe(8.75);
      expect(PRINT_SPECS.interiorHeight).toBe(8.75);
    });

    it("calculates pixel dimensions at 300 DPI", () => {
      expect(PRINT_SPECS.interiorWidthPx).toBe(2625);
      expect(PRINT_SPECS.interiorHeightPx).toBe(2625);
    });

    it("has correct page count constraints", () => {
      expect(PRINT_SPECS.minPages).toBe(24);
      expect(PRINT_SPECS.maxPages).toBe(800);
    });

    it("has correct pricing", () => {
      expect(PRINT_SPECS.priceInCents).toBe(4999);
      expect(PRINT_SPECS.estimatedCostInCents).toBe(2000);
    });
  });

  describe("getSpineWidth", () => {
    it("returns minimum spine width for minimum pages", () => {
      expect(getSpineWidth(24)).toBe(0.25);
    });

    it("returns correct spine width for mid-range pages", () => {
      expect(getSpineWidth(100)).toBe(0.5);
      expect(getSpineWidth(200)).toBe(0.75);
      expect(getSpineWidth(350)).toBe(1.0625);
    });

    it("returns correct spine width for maximum pages", () => {
      expect(getSpineWidth(800)).toBe(2.125);
    });

    it("returns default for out of range", () => {
      expect(getSpineWidth(10)).toBe(0.25);
      expect(getSpineWidth(1000)).toBe(0.25);
    });
  });

  describe("getCoverDimensions", () => {
    it("calculates cover dimensions for minimum pages", () => {
      const dims = getCoverDimensions(24);
      
      // With 0.25" spine, total width should be:
      // 0.125*2 (bleed) + 0.75*4 (wrap) + 8.5*2 (covers) + 0.25 (spine) = 20.5"
      expect(dims.spineWidth).toBe(0.25);
      expect(dims.width).toBeCloseTo(20.5, 2);
      expect(dims.height).toBeCloseTo(10.5, 2);
    });

    it("includes pixel dimensions", () => {
      const dims = getCoverDimensions(24);
      expect(dims.widthPx).toBeGreaterThan(0);
      expect(dims.heightPx).toBeGreaterThan(0);
    });

    it("includes points dimensions for PDF", () => {
      const dims = getCoverDimensions(24);
      expect(dims.widthPts).toBeGreaterThan(0);
      expect(dims.heightPts).toBeGreaterThan(0);
    });

    it("includes layout positions", () => {
      const dims = getCoverDimensions(24);
      expect(dims.backCoverX).toBeDefined();
      expect(dims.spineX).toBeDefined();
      expect(dims.frontCoverX).toBeDefined();
    });
  });

  describe("calculatePrintedPageCount", () => {
    it("meets minimum 24 pages for small stop counts", () => {
      expect(calculatePrintedPageCount(8)).toBeGreaterThanOrEqual(24);
      expect(calculatePrintedPageCount(9)).toBeGreaterThanOrEqual(24);
    });

    it("calculates correctly for 10 stops", () => {
      // 10 stops * 2 pages = 20 + 2 front + 2 back = 24
      const count = calculatePrintedPageCount(10);
      expect(count).toBeGreaterThanOrEqual(24);
    });

    it("scales correctly with more stops", () => {
      const count8 = calculatePrintedPageCount(8);
      const count12 = calculatePrintedPageCount(12);
      const count14 = calculatePrintedPageCount(14);
      
      expect(count12).toBeGreaterThanOrEqual(count8);
      expect(count14).toBeGreaterThan(count12);
    });
  });

  describe("analyzeImageForPrint", () => {
    it("marks high-res images as ready", () => {
      const analysis = analyzeImageForPrint(3000, 3000);
      expect(analysis.status).toBe("ready");
    });

    it("marks acceptable quality images", () => {
      const analysis = analyzeImageForPrint(2200, 2200);
      expect(analysis.status).toBe("acceptable");
    });

    it("identifies images needing upscale", () => {
      const analysis = analyzeImageForPrint(1500, 1500);
      expect(analysis.status).toBe("needs_upscale");
    });

    it("rejects too-small images", () => {
      const analysis = analyzeImageForPrint(500, 500);
      expect(analysis.status).toBe("too_small");
    });

    it("calculates effective DPI", () => {
      const analysis = analyzeImageForPrint(2550, 2550);
      // At 8.5" print size, 2550 pixels = 300 DPI
      expect(analysis.effectiveDpi).toBe(300);
    });

    it("provides scale factor for upscaling", () => {
      const analysis = analyzeImageForPrint(1000, 1000);
      expect(analysis.scaleFactor).toBeGreaterThan(1);
    });
  });

  describe("generateBookStructure", () => {
    it("generates structure for minimum stops", () => {
      const structure = generateBookStructure(8);
      expect(structure.length).toBeGreaterThanOrEqual(24);
    });

    it("starts with title page", () => {
      const structure = generateBookStructure(10);
      expect(structure[0].type).toBe("title");
      expect(structure[0].pageNumber).toBe(1);
    });

    it("has dedication page", () => {
      const structure = generateBookStructure(10);
      expect(structure[1].type).toBe("dedication");
    });

    it("includes story pages for each stop", () => {
      const structure = generateBookStructure(10);
      const storyPages = structure.filter(
        (p) => p.type === "story_left" || p.type === "story_right"
      );
      // 10 stops * 2 pages = 20 story pages
      expect(storyPages.length).toBe(20);
    });

    it("ends with back matter", () => {
      const structure = generateBookStructure(10);
      const lastPage = structure[structure.length - 1];
      expect(["end", "blank"]).toContain(lastPage.type);
    });

    it("assigns correct stop numbers", () => {
      const structure = generateBookStructure(10);
      const stop1Pages = structure.filter((p) => p.stopNumber === 1);
      expect(stop1Pages.length).toBe(2);
    });
  });

  describe("STOP_OPTIONS", () => {
    it("has correct default options", () => {
      expect(STOP_OPTIONS.length).toBe(4);
      expect(STOP_OPTIONS.map((o) => o.stops)).toEqual([8, 10, 12, 14]);
    });

    it("marks 10 stops as recommended", () => {
      const recommended = STOP_OPTIONS.find((o) => o.recommended);
      expect(recommended?.stops).toBe(10);
    });

    it("calculates page counts for all options", () => {
      STOP_OPTIONS.forEach((opt) => {
        expect(opt.pageCount).toBeGreaterThanOrEqual(24);
      });
    });
  });

  describe("US_STATES", () => {
    it("has all 50 states plus DC", () => {
      expect(Object.keys(US_STATES).length).toBe(51);
    });

    it("has correct format (code -> name)", () => {
      expect(US_STATES.NY).toBe("New York");
      expect(US_STATES.CA).toBe("California");
      expect(US_STATES.DC).toBe("District of Columbia");
    });
  });

  describe("LULU_POD_PACKAGE_ID", () => {
    it("is defined and follows expected format", () => {
      expect(LULU_POD_PACKAGE_ID).toBeDefined();
      expect(LULU_POD_PACKAGE_ID).toMatch(/^0850X0850/); // 8.5 x 8.5 prefix
    });
  });
});
