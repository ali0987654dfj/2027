const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    const data = body?.data ?? body;

    if (!data || typeof data !== "object" || !Array.isArray(data.teachers)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "البيانات غير صحيحة: يجب أن تحتوي على teachers"
        }),
        { status: 400, headers }
      );
    }

    const token = Netlify.env.get("GITHUB_TOKEN");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GITHUB_TOKEN غير موجود في Netlify"
        }),
        { status: 500, headers }
      );
    }

    const owner = "time110943";
    const repo = "2026";
    const path = "dataab2026.js";
    const branch = "main";

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const githubHeaders = {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    };

    const currentResponse = await fetch(
      `${apiUrl}?ref=${encodeURIComponent(branch)}`,
      { method: "GET", headers: githubHeaders }
    );

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();

      return new Response(
        JSON.stringify({
          success: false,
          error: "تعذر قراءة dataab2026.js من GitHub",
          details: errorText
        }),
        { status: currentResponse.status, headers }
      );
    }

    const currentFile = await currentResponse.json();

    if (!currentFile?.sha) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "لم يتم العثور على SHA للملف"
        }),
        { status: 500, headers }
      );
    }

    const jsContent =
      "window.dataAb2026 = " +
      JSON.stringify(data, null, 2) +
      ";\n";

    const encodedContent = Buffer
      .from(jsContent, "utf8")
      .toString("base64");

    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        ...githubHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: body?.message ?? "Update lectures from control panel",
        content: encodedContent,
        sha: currentFile.sha,
        branch
      })
    });

    const result = await updateResponse.json().catch(() => ({}));

    if (!updateResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "فشل تحديث dataab2026.js في GitHub",
          details: result
        }),
        { status: updateResponse.status, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم حفظ البيانات بنجاح",
        commit: result?.commit?.sha ?? null
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message ?? "خطأ غير معروف"
      }),
      { status: 500, headers }
    );
  }
};
