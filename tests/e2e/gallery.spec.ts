import { expect, test } from "@playwright/test";
import { writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

test("gallery shows four columns, lazy images, captions, and a fullscreen modal", async ({
  page,
}) => {
  const suffix = randomUUID();
  const slug = `gallery-test-${suffix}`;
  const file = path.join(process.cwd(), "public", "blogs", `${slug}.json`);
  const images = Array.from({ length: 4 }, (_, index) => ({
    src: `/images/hero.webp?gallery=${suffix}-${index}`,
    alt: `View ${index + 1}`,
    caption: `Gallery caption ${suffix}-${index + 1}`,
  }));
  await writeFile(
    file,
    JSON.stringify({
      version: 1,
      slug,
      title: "Gallery test story",
      author: "Gallery Writer",
      description: "",
      coverImage: images[0].src,
      createdAt: new Date().toISOString(),
      content: [
        { id: "image", type: "image", ...images[0] },
        {
          id: "row",
          type: "row",
          columns: [
            {
              id: "column",
              content: [{ id: "nested-image", type: "image", ...images[1] }],
            },
          ],
        },
        { id: "carousel", type: "carousel", images: images.slice(2) },
      ],
    }),
    { flag: "wx" },
  );
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/gallery");
    const grid = page.locator('[aria-label="Blog image gallery"]');
    expect(
      await grid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
    ).toBe(4);
    for (const image of images) {
      await expect(
        grid.getByText(image.caption, { exact: true }),
      ).toBeVisible();
      await expect(
        grid.getByRole("img", { name: image.alt, exact: true }),
      ).toHaveAttribute("loading", "lazy");
    }
    const opener = page.getByRole("button", {
      name: `View image: ${images[0].caption}`,
      exact: true,
    });
    await opener.click();
    const modal = page.getByRole("dialog", {
      name: images[0].caption,
      exact: true,
    });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("img")).toHaveAttribute("src", images[0].src);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await modal
      .getByRole("button", { name: "Fullscreen", exact: true })
      .click();
    await expect(
      modal.getByRole("button", { name: "Exit fullscreen", exact: true }),
    ).toBeVisible();
    expect(
      await modal.evaluate(
        (element) =>
          element.getBoundingClientRect().width >= window.innerWidth - 2,
      ),
    ).toBeTruthy();
    await modal
      .getByRole("button", { name: "Exit fullscreen", exact: true })
      .click();
    await modal
      .getByRole("button", { name: "Close image viewer", exact: true })
      .click();
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await opener.click();
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await grid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
    ).toBe(2);
    await opener.click();
    await expect(modal).toBeVisible();
    expect(
      await modal.evaluate(
        (element) => element.getBoundingClientRect().width <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    await rm(file);
  }
});
