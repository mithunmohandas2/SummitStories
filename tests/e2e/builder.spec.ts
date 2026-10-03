import { expect, test } from "@playwright/test";
import { readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

test("JSON API and reader handle published stories or an empty catalogue", async ({
  page,
  request,
}) => {
  const list = await request.get("/api/blogs");
  expect(list.ok()).toBeTruthy();
  const { blogs } = await list.json();
  expect(Array.isArray(blogs)).toBeTruthy();
  expect((await request.get("/api/blogs/unknown-blog")).status()).toBe(404);
  await page.goto("/blogs");
  if (blogs.length) {
    const blog = blogs[0];
    const detail = await request.get(`/api/blogs/${blog.slug}`);
    expect(detail.ok()).toBeTruthy();
    expect((await detail.json()).content.length).toBeGreaterThan(0);
    await expect(
      page.getByRole("link", { name: blog.title, exact: false }).first(),
    ).toBeVisible();
    await page.goto(`/blogs/${blog.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      blog.title,
    );
  } else {
    await expect(page.getByText("No stories published yet.")).toBeVisible();
  }
});

test("login guards builder, validates credentials, and supports editing, download, import, and logout", async ({
  page,
}) => {
  await page.goto("/builder");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Username", { exact: true }).fill("test-writer");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("incorrect");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-writer-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByText("Writing as Test Writer")).toBeVisible();

  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toBeVisible();
  await page
    .getByLabel("Blog title", { exact: true })
    .fill("Journey Across Hills");
  await page.getByRole("button", { name: "+ Paragraph", exact: true }).click();
  await page
    .getByLabel("Paragraph", { exact: true })
    .fill("The mountains were beautiful.");
  await page.getByRole("button", { name: "+ Subheading", exact: true }).click();
  await page.getByLabel("Subheading", { exact: true }).fill("A new morning");
  await page
    .getByRole("button", { name: "+ Row / columns", exact: true })
    .click();
  const row = page.getByRole("region", { name: "row block 3", exact: true });
  await row
    .getByRole("button", { name: "+ Image", exact: true })
    .first()
    .click();
  await row.getByLabel("Image URL", { exact: true }).fill("/images/logo.webp");
  await row.getByLabel("Alternative text", { exact: true }).fill("Summit logo");
  await row
    .getByRole("button", { name: "+ YouTube video", exact: true })
    .last()
    .click();
  await row
    .getByLabel("YouTube URL", { exact: true })
    .fill("https://youtu.be/dQw4w9WgXcQ");
  await page
    .getByRole("button", { name: "+ Image carousel", exact: true })
    .last()
    .click();
  const carousel = page.getByRole("region", {
    name: "carousel block 4",
    exact: true,
  });
  await carousel
    .getByLabel("Image URL", { exact: true })
    .fill("/images/hero.webp");
  await carousel
    .getByRole("button", { name: "Add slide", exact: true })
    .click();
  await carousel
    .getByLabel("Image URL", { exact: true })
    .last()
    .fill("/images/logo.webp");

  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Journey Across Hills", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("The mountains were beautiful.")).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie/,
  );
  await page.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Back to editor", exact: true })
    .click();

  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toBe("Journey Across Hills.json");
  const file = (await download.path())!;
  const raw = await readFile(file, "utf8");
  const blog = JSON.parse(raw);
  expect(blog.author).toBe("Test Writer");
  expect(blog.authorUsername).toBe("test-writer");
  expect(blog.content.map((block: { type: string }) => block.type)).toEqual([
    "paragraph",
    "heading",
    "row",
    "carousel",
  ]);
  expect(blog.content[2].columns).toHaveLength(2);
  expect(raw).not.toContain("test-writer-password");
  await page.getByLabel("Import blog JSON", { exact: true }).setInputFiles({
    name: download.suggestedFilename(),
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await expect(page.getByRole("status")).toContainText("Blog imported");
  await expect(page.getByLabel("Blog title", { exact: true })).toHaveValue(
    "Journey Across Hills",
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/builder");
  await expect(page).toHaveURL(/\/login$/);
});

test("author query filters the API and visible stories by stored username", async ({
  page,
  request,
}) => {
  const suffix = randomUUID();
  const entries = [
    {
      slug: `author-filter-${suffix}-first`,
      title: `First story ${suffix}`,
      author: "Same Display Name",
      authorUsername: "UNIX00001",
    },
    {
      slug: `author-filter-${suffix}-second`,
      title: `Second story ${suffix}`,
      author: "Same Display Name",
      authorUsername: "unix00002",
    },
  ];
  const createdFiles: string[] = [];
  try {
    for (const entry of entries) {
      const file = path.join(
        process.cwd(),
        "public",
        "blogs",
        `${entry.slug}.json`,
      );
      await writeFile(
        file,
        JSON.stringify({
          ...entry,
          version: 1,
          description: "",
          coverImage: "",
          createdAt: new Date().toISOString(),
          content: [
            {
              id: "paragraph",
              type: "paragraph",
              text: "An author filter test story.",
            },
          ],
        }),
        { flag: "wx" },
      );
      createdFiles.push(file);
    }
    const filtered = await request.get("/api/blogs?author=unix00001");
    expect(filtered.ok()).toBeTruthy();
    const results = (await filtered.json()).blogs;
    expect(results.map((blog: { slug: string }) => blog.slug)).toContain(
      entries[0].slug,
    );
    expect(results.map((blog: { slug: string }) => blog.slug)).not.toContain(
      entries[1].slug,
    );
    await page.goto("/blogs?author=unix00001");
    await expect(
      page.getByRole("link", { name: entries[0].title, exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: entries[1].title, exact: false }),
    ).toHaveCount(0);
    await page
      .getByRole("link", { name: "View all blogs", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: entries[1].title, exact: false }),
    ).toBeVisible();
    await page.goto(`/blogs?author=unknown-${suffix}`);
    await expect(
      page.getByText(`No stories published by unknown-${suffix}.`, {
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    for (const file of createdFiles) await rm(file);
  }
});

test("navigation remains usable on mobile and tablet screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(
    mobile.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(
    mobile.getByRole("link", { name: "Log in", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("region", { name: "Settings options" })
    .getByRole("link", { name: "Log in", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(mobile).not.toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Color mode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("color mode persists and browser default follows live browser preferences", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/login");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const selector = page.getByRole("combobox", { name: "Color mode" });
  await expect(selector).toHaveValue("system");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await selector.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByLabel("Username", { exact: true })).toHaveCSS(
    "background-color",
    "rgb(17, 24, 39)",
  );
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(selector).toHaveValue("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await selector.selectOption("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await selector.selectOption("system");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(selector).toBeVisible();
  await selector.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("gear dropdown contains account and color controls and dismisses with Escape or outside click", async ({
  page,
}) => {
  await page.goto("/");
  const gear = page.getByRole("button", { name: "Settings", exact: true });
  const dropdown = page.getByRole("region", { name: "Settings options" });
  await expect(dropdown).not.toBeVisible();
  await gear.click();
  await expect(gear).toHaveAttribute("aria-expanded", "true");
  await expect(
    dropdown.getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  await expect(
    dropdown.getByRole("combobox", { name: "Color mode" }),
  ).toBeVisible();
  await expect(dropdown.getByRole("link")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dropdown).not.toBeVisible();
  await expect(gear).toBeFocused();
  await gear.click();
  await page
    .getByRole("heading", { name: "Latest Blogs", exact: true })
    .click();
  await expect(dropdown).not.toBeVisible();
});

test("login accepts a bare username/password pair and rejects whitespace changes", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill("plain-writer ");
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("incorrect");
  await page.getByLabel("Username", { exact: true }).fill("plain-writer");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByText("Writing as plain-writer")).toBeVisible();
});
