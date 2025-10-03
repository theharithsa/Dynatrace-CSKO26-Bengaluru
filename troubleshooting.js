const TROUBLESHOOTING_SOURCE = 'troubleshooting-guide.md';

document.addEventListener('DOMContentLoaded', () => {
  renderTroubleshootingDoc();
});

function renderTroubleshootingDoc() {
  const container = document.querySelector('[data-troubleshooting-target]');
  if (!container) return;

  const source = container.getAttribute('data-source') || TROUBLESHOOTING_SOURCE;
  const toc = document.querySelector('[data-troubleshooting-toc]');

  container.innerHTML = '<p class="doc__placeholder">Loading troubleshooting guide...</p>';

  fetch(source)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .then((markdown) => {
      const parsed = parseMarkdown(markdown);
      container.innerHTML = parsed.html;

      if (!toc) return;

      if (parsed.headings.length) {
        const list = document.createElement('ul');
        list.className = 'toc__list';

        parsed.headings.forEach((heading) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${heading.id}`;
          link.textContent = heading.text;
          item.appendChild(link);
          list.appendChild(item);
        });

        toc.innerHTML = '';
        toc.appendChild(list);
        toc.removeAttribute('hidden');
      } else {
        toc.setAttribute('hidden', 'hidden');
        toc.innerHTML = '';
      }
    })
    .catch((error) => {
      const runningFromFile = window.location.protocol === 'file:';
      const hint = runningFromFile
        ? 'Serve the project with a local web server (for example: <code>python -m http.server</code>) so the browser allows fetching local files.'
        : 'Check that the Markdown file exists and is reachable.';
      container.innerHTML = `<p class="doc__placeholder">Unable to load the troubleshooting guide. ${hint}</p>`;
      if (toc) {
        toc.setAttribute('hidden', 'hidden');
        toc.innerHTML = '';
      }
      console.error('Failed to load troubleshooting guide', error);
    });
}

function parseMarkdown(markdown) {
  if (!markdown || !markdown.trim()) {
    return {
      html: '<p class="doc__placeholder">No troubleshooting notes yet. Update <code>troubleshooting-guide.md</code> to populate this page.</p>',
      headings: []
    };
  }

  const lines = markdown.replace(/\r?\n/g, '\n').split('\n');
  const htmlParts = [];
  const headings = [];
  let inUl = false;
  let inOl = false;
  let paragraph = [];
  const slugCounts = new Map();

  const closeLists = () => {
    if (inUl) {
      htmlParts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlParts.push('</ol>');
      inOl = false;
    }
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) {
      htmlParts.push(`<p>${formatInline(text)}</p>`);
    }
    paragraph = [];
  };

  const slugify = (value) => {
    const base =
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'section';
    const count = slugCounts.get(base) || 0;
    slugCounts.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeLists();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      const textContent = headingMatch[2].trim();
      const id = slugify(textContent);
      flushParagraph();
      closeLists();
      htmlParts.push(`<h${level} id="${id}">${formatInline(textContent)}</h${level}>`);
      if (level <= 3) {
        headings.push({ level, id, text: textContent });
      }
      return;
    }

    const listMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      if (!inUl) {
        closeLists();
        htmlParts.push('<ul class="doc__list">');
        inUl = true;
      }
      htmlParts.push(`<li>${formatInline(listMatch[1])}</li>`);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!inOl) {
        closeLists();
        htmlParts.push('<ol class="doc__list doc__list--ordered">');
        inOl = true;
      }
      htmlParts.push(`<li>${formatInline(orderedMatch[1])}</li>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  closeLists();

  return {
    html: htmlParts.join('\n'),
    headings
  };
}

function formatInline(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}
