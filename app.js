(function () {
  const root = document.getElementById("listings");
  const empty = document.getElementById("empty");
  const listings = Array.isArray(window.LISTINGS) ? window.LISTINGS : [];

  const statusLabel = {
    avaliando: "Avaliando",
    favorita: "Favorita",
    descartada: "Descartada",
  };

  if (!listings.length) {
    empty.classList.remove("hidden");
    return;
  }

  const order = { favorita: 0, avaliando: 1, descartada: 2 };
  const sorted = [...listings].sort(
    (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)
  );

  const frag = document.createDocumentFragment();

  sorted.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = `listing listing--${item.status || "avaliando"}`;
    article.style.setProperty("--i", String(index));

    const meta = [
      item.local,
      item.preco,
      item.pessoas ? `${item.pessoas} pessoas` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    article.innerHTML = `
      <div class="listing-top">
        <span class="status">${statusLabel[item.status] || "Avaliando"}</span>
        <h3>${escapeHtml(item.nome || "Sem nome")}</h3>
        <p class="meta">${escapeHtml(meta)}</p>
      </div>
      ${
        item.notas
          ? `<p class="notas">${escapeHtml(item.notas)}</p>`
          : ""
      }
      ${
        item.link
          ? `<a class="listing-link" href="${escapeAttr(
              item.link
            )}" target="_blank" rel="noopener noreferrer">Abrir anúncio</a>`
          : ""
      }
    `;

    frag.appendChild(article);
  });

  root.appendChild(frag);

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }
})();
