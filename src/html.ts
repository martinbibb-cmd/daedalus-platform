export const htmlHeaders = {
  "content-type": "text/html; charset=utf-8"
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172026;
      background: #f7f8f8;
      line-height: 1.5;
    }
    body { margin: 0; }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 48px;
    }
    a { color: #075985; }
    h1 {
      margin: 0 0 4px;
      font-size: clamp(1.8rem, 5vw, 2.6rem);
      line-height: 1.1;
    }
    h2 { margin: 28px 0 12px; font-size: 1.2rem; }
    h3 { margin: 0 0 10px; font-size: 1rem; }
    code { overflow-wrap: anywhere; }
    .topline {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    .muted { color: #5d6b73; }
    .grid, .card-grid, .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
    }
    .stat, .panel, .detail {
      background: #ffffff;
      border: 1px solid #d8dee2;
      border-radius: 8px;
      padding: 14px;
    }
    .stat strong {
      display: block;
      font-size: 1.45rem;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }
    .stat span, .detail span {
      display: block;
      color: #5d6b73;
      font-size: 0.85rem;
    }
    .detail strong {
      display: block;
      margin-top: 3px;
      overflow-wrap: anywhere;
    }
    .panel-section { margin-top: 24px; }
    .boundary {
      margin-top: 28px;
      padding: 14px;
      border: 1px solid #cbd5dc;
      border-radius: 8px;
      background: #eef2f3;
    }
    .boundary p { margin: 0; }
    .boundary p + p { margin-top: 6px; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border: 1px solid #d8dee2;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #e8ecef;
      text-align: left;
      vertical-align: top;
    }
    th { background: #eef2f3; font-size: 0.9rem; }
    tr:last-child td { border-bottom: 0; }
    @media (max-width: 720px) {
      main { width: min(100% - 20px, 1120px); padding-top: 16px; }
      .topline { display: block; }
      table, thead, tbody, tr, th, td { display: block; }
      thead { display: none; }
      tr { border-bottom: 1px solid #d8dee2; }
      td { border: 0; padding: 8px 10px; }
      td::before {
        content: attr(data-label);
        display: block;
        color: #5d6b73;
        font-size: 0.8rem;
        font-weight: 700;
      }
    }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`,
    { headers: htmlHeaders }
  );
}
