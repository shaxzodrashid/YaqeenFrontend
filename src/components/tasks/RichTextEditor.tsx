import React, { useEffect, useRef } from 'react';
import { Tooltip } from '@heroui/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link as LinkIcon,
} from 'lucide-react';

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? '⌘' : 'Ctrl+';
const shiftKey = isMac ? '⇧' : 'Shift+';

interface FormatItem {
  command: string;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORMAT_GROUPS: FormatItem[][] = [
  [
    { command: 'bold', label: 'Bold', shortcut: `${modKey}B`, icon: Bold },
    { command: 'italic', label: 'Italic', shortcut: `${modKey}I`, icon: Italic },
    { command: 'strikeThrough', label: 'Strikethrough', shortcut: `${modKey}${shiftKey}X`, icon: Strikethrough },
  ],
  [
    { command: 'code', label: 'Inline Code', shortcut: `${modKey}E`, icon: Code },
    { command: 'h3', label: 'Heading', shortcut: `${modKey}${shiftKey}H`, icon: Heading },
  ],
  [
    { command: 'unorderedList', label: 'Bullet List', shortcut: `${modKey}${shiftKey}8`, icon: List },
    { command: 'orderedList', label: 'Numbered List', shortcut: `${modKey}${shiftKey}7`, icon: ListOrdered },
    { command: 'taskCheckbox', label: 'Task Checkbox', shortcut: `${modKey}${shiftKey}T`, icon: CheckSquare },
    { command: 'blockquote', label: 'Quote', shortcut: `${modKey}${shiftKey}Q`, icon: Quote },
    { command: 'link', label: 'Link', shortcut: `${modKey}K`, icon: LinkIcon },
  ],
];

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
}

// Helper to escape HTML tags and render inline markdown elements
function formatInlineMarkdownHtml(str: string): string {
  if (!str) return '';
  let res = str;

  // Escape HTML entities to prevent rendering raw HTML tags
  res = res
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Strikethrough ~~text~~
  res = res.replace(/~~(.*?)~~/g, '<del>$1</del>');
  // Code `text`
  res = res.replace(/`(.*?)`/g, '<code>$1</code>');
  // Links [text](url)
  res = res.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return res;
}

// Convert markdown string to structured HTML
function markdownToHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
    if (inOl) {
      html += '</ol>';
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      closeLists();
      html += `<h1>${formatInlineMarkdownHtml(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      closeLists();
      html += `<h2>${formatInlineMarkdownHtml(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      closeLists();
      html += `<h3>${formatInlineMarkdownHtml(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith('> ')) {
      closeLists();
      html += `<blockquote>${formatInlineMarkdownHtml(trimmed.slice(2))}</blockquote>`;
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      closeLists();
      const checked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
      const content = trimmed.substring(6);
      html += `<div class="task-item-row" data-task-status="${checked ? 'done' : 'todo'}">` +
        `<input type="checkbox" class="task-checkbox-input" ${checked ? 'checked' : ''} />` +
        `<span>${formatInlineMarkdownHtml(content)}</span>` +
        `</div>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed === '-' || trimmed === '*') {
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      const content = (trimmed === '-' || trimmed === '*') ? '' : trimmed.slice(2);
      const renderedContent = formatInlineMarkdownHtml(content);
      html += `<li>${renderedContent || '<br>'}</li>`;
    } else if (/^\d+\.\s/.test(trimmed) || /^\d+\.$/.test(trimmed)) {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (!inOl) {
        html += '<ol>';
        inOl = true;
      }
      const content = trimmed.replace(/^\d+\.\s*/, '');
      const renderedContent = formatInlineMarkdownHtml(content);
      html += `<li>${renderedContent || '<br>'}</li>`;
    } else if (trimmed === '') {
      closeLists();
      html += '<p><br></p>';
    } else {
      closeLists();
      html += `<p>${formatInlineMarkdownHtml(line)}</p>`;
    }
  }
  closeLists();
  return html;
}

// Convert HTML from editor back to markdown string
function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const traverse = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName;

      // Inline elements
      if (tagName === 'STRONG' || tagName === 'B') {
        return `**${Array.from(el.childNodes).map(traverse).join('')}**`;
      }
      if (tagName === 'EM' || tagName === 'I') {
        return `*${Array.from(el.childNodes).map(traverse).join('')}*`;
      }
      if (tagName === 'DEL' || tagName === 'S') {
        return `~~${Array.from(el.childNodes).map(traverse).join('')}~~`;
      }
      if (tagName === 'CODE') {
        return `\`${Array.from(el.childNodes).map(traverse).join('')}\``;
      }
      if (tagName === 'A') {
        const href = el.getAttribute('href') || '';
        const text = Array.from(el.childNodes).map(traverse).join('');
        return `[${text}](${href})`;
      }
      if (tagName === 'BR') {
        return '\n';
      }

      // Check if it's a task item row
      if (el.classList.contains('task-item-row')) {
        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        const checked = checkbox?.checked || el.getAttribute('data-task-status') === 'done';
        const span = el.querySelector('span');
        const innerText = span ? Array.from(span.childNodes).map(traverse).join('') : el.innerText;
        return `- [${checked ? 'x' : ' '}] ${innerText.trim()}\n`;
      }

      // Block elements
      let innerContent = Array.from(el.childNodes).map(traverse).join('');

      if (tagName === 'H1') {
        return `# ${innerContent.trim()}\n`;
      }
      if (tagName === 'H2') {
        return `## ${innerContent.trim()}\n`;
      }
      if (tagName === 'H3') {
        return `### ${innerContent.trim()}\n`;
      }
      if (tagName === 'BLOCKQUOTE') {
        return `> ${innerContent.trim()}\n`;
      }
      if (tagName === 'LI') {
        const parent = el.parentElement;
        if (parent && parent.tagName === 'OL') {
          const index = Array.from(parent.children).indexOf(el) + 1;
          return `${index}. ${innerContent.trim()}\n`;
        }
        return `- ${innerContent.trim()}\n`;
      }
      if (tagName === 'UL' || tagName === 'OL') {
        return innerContent;
      }
      if (tagName === 'P') {
        if (innerContent === '\n' || innerContent.trim() === '') {
          return '\n';
        }
        return `${innerContent.trim()}\n`;
      }
      if (tagName === 'DIV') {
        if (innerContent === '\n' || innerContent.trim() === '') {
          return '\n';
        }
        return `${innerContent.trim()}\n`;
      }

      return innerContent;
    }

    return '';
  };

  const md = Array.from(body.childNodes).map(traverse).join('');
  return md.trim();
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write text or markdown here...',
  readOnly = false,
  minHeight = '140px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditing = useRef(false);

  // Sync markdown values from parent, avoiding updates while user is typing to prevent cursor reset
  useEffect(() => {
    if (editorRef.current && !isEditing.current) {
      const html = markdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    isEditing.current = true;
    const html = editorRef.current.innerHTML;
    const md = htmlToMarkdown(html);
    onChange(md);
  };

  const handleBlur = () => {
    isEditing.current = false;
    if (editorRef.current) {
      if (editorRef.current.innerText.trim() === '') {
        editorRef.current.innerHTML = '';
      }
      const html = editorRef.current.innerHTML;
      const md = htmlToMarkdown(html);
      onChange(md);
    }
  };

  const applyFormat = (command: string) => {
    if (readOnly) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (command === 'bold') {
      document.execCommand('bold', false);
    } else if (command === 'italic') {
      document.execCommand('italic', false);
    } else if (command === 'strikeThrough') {
      document.execCommand('strikeThrough', false);
    } else if (command === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else if (command === 'h3') {
      document.execCommand('formatBlock', false, 'h3');
    } else if (command === 'unorderedList') {
      document.execCommand('insertUnorderedList', false);
    } else if (command === 'orderedList') {
      document.execCommand('insertOrderedList', false);
    } else if (command === 'code') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (selectedText) {
          const codeElement = document.createElement('code');
          codeElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeElement);
          range.selectNode(codeElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } else if (command === 'link') {
      const url = prompt('Enter the link URL (e.g. https://google.com):');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else if (command === 'taskCheckbox') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const blockHTML = `<div class="task-item-row" data-task-status="todo"><input type="checkbox" class="task-checkbox-input" /><span>&nbsp;</span></div>`;
        document.execCommand('insertHTML', false, blockHTML);
      }
    }

    handleInput();
  };

  const turnCurrentLineIntoList = (listType: 'ul' | 'ol' | 'task', prefixLength: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    const offset = range.startOffset;

    if (container.nodeType !== Node.TEXT_NODE) return;

    const fullText = container.textContent || '';
    const prefixStart = offset - prefixLength;
    const textBeforePrefix = fullText.slice(0, prefixStart);
    const textAfterPrefix = fullText.slice(offset);

    // Find enclosing block element
    let block: HTMLElement | null = container.parentElement;
    while (block && block !== editorRef.current && !['P', 'DIV', 'LI', 'BLOCKQUOTE'].includes(block.tagName)) {
      block = block.parentElement;
    }

    if (!block || block === editorRef.current) {
      document.execCommand(listType === 'ol' ? 'insertOrderedList' : 'insertUnorderedList', false);
      return;
    }

    // Check if textBeforePrefix has a newline (\n or \r)
    const lastNL = Math.max(textBeforePrefix.lastIndexOf('\n'), textBeforePrefix.lastIndexOf('\r'));

    let targetBlock: HTMLElement = block;

    if (lastNL !== -1) {
      // Case 1: Newline is inside container text node before prefix.
      const textBeforeNL = textBeforePrefix.slice(0, lastNL);
      container.textContent = textBeforeNL;

      const newP = document.createElement('p');
      if (textAfterPrefix) {
        newP.appendChild(document.createTextNode(textAfterPrefix));
      }

      let nextSibling = container.nextSibling;
      while (nextSibling) {
        const toMove = nextSibling;
        nextSibling = nextSibling.nextSibling;
        newP.appendChild(toMove);
      }

      block.after(newP);
      targetBlock = newP;
    } else {
      // Case 2: Newline is not in text node. Remove prefix from container.
      container.textContent = textBeforePrefix + textAfterPrefix;

      let prevSibling = container.previousSibling;
      let brNode: Node | null = null;
      while (prevSibling) {
        if (prevSibling.nodeName === 'BR') {
          brNode = prevSibling;
          break;
        }
        prevSibling = prevSibling.previousSibling;
      }

      if (brNode) {
        const newP = document.createElement('p');
        let nextNode = brNode.nextSibling;
        while (nextNode) {
          const toMove = nextNode;
          nextNode = nextNode.nextSibling;
          newP.appendChild(toMove);
        }
        if (brNode.parentNode) {
          brNode.parentNode.removeChild(brNode);
        }
        block.after(newP);
        targetBlock = newP;
      }
    }

    if (listType === 'task') {
      const taskRow = document.createElement('div');
      taskRow.className = 'task-item-row';
      taskRow.setAttribute('data-task-status', 'todo');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox-input';

      const span = document.createElement('span');
      while (targetBlock.firstChild) {
        span.appendChild(targetBlock.firstChild);
      }
      if (span.innerText.trim() === '') {
        span.innerHTML = '&nbsp;';
      }

      taskRow.appendChild(checkbox);
      taskRow.appendChild(span);

      targetBlock.replaceWith(taskRow);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }

    const li = document.createElement('li');
    while (targetBlock.firstChild) {
      li.appendChild(targetBlock.firstChild);
    }
    if (li.innerText.trim() === '') {
      li.innerHTML = '<br>';
    }

    const prevEl = targetBlock.previousElementSibling;
    const listTag = listType === 'ol' ? 'OL' : 'UL';

    let listEl: HTMLElement;
    if (prevEl && prevEl.tagName === listTag) {
      listEl = prevEl as HTMLElement;
      listEl.appendChild(li);
      targetBlock.remove();
    } else {
      listEl = document.createElement(listType === 'ol' ? 'ol' : 'ul');
      listEl.appendChild(li);
      targetBlock.replaceWith(listEl);
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;

    // Keyboard shortcuts (Ctrl / Cmd + Key)
    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();

      if (key === 'b' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        applyFormat('bold');
        return;
      }
      if (key === 'i' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        applyFormat('italic');
        return;
      }
      if ((key === 'x' || key === 's') && e.shiftKey) {
        e.preventDefault();
        applyFormat('strikeThrough');
        return;
      }
      if ((key === 'e' && !e.shiftKey) || (key === 'c' && e.shiftKey)) {
        e.preventDefault();
        applyFormat('code');
        return;
      }
      if ((key === 'h' && e.shiftKey) || (key === '1' && e.altKey)) {
        e.preventDefault();
        applyFormat('h3');
        return;
      }
      if ((key === '8' && e.shiftKey) || (key === 'u' && e.shiftKey)) {
        e.preventDefault();
        turnCurrentLineIntoList('ul', 0);
        handleInput();
        return;
      }
      if ((key === '7' && e.shiftKey) || (key === 'o' && e.shiftKey)) {
        e.preventDefault();
        turnCurrentLineIntoList('ol', 0);
        handleInput();
        return;
      }
      if (key === 't' && e.shiftKey) {
        e.preventDefault();
        turnCurrentLineIntoList('task', 0);
        handleInput();
        return;
      }
      if (key === 'q' && e.shiftKey) {
        e.preventDefault();
        applyFormat('blockquote');
        return;
      }
      if (key === 'k' && !e.shiftKey) {
        e.preventDefault();
        applyFormat('link');
        return;
      }
    }

    // Space interception for auto-lists and checkbox elements
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;

        if (container.nodeType === Node.TEXT_NODE) {
          const textBeforeContent = container.textContent?.slice(0, offset) || '';
          const lastNewlineIndex = Math.max(
            textBeforeContent.lastIndexOf('\n'),
            textBeforeContent.lastIndexOf('\r')
          );
          const lineTextBefore = lastNewlineIndex !== -1
            ? textBeforeContent.slice(lastNewlineIndex + 1)
            : textBeforeContent;

          const trimmedPrefix = lineTextBefore.trim();

          if (trimmedPrefix === '-' || trimmedPrefix === '*') {
            e.preventDefault();
            turnCurrentLineIntoList('ul', lineTextBefore.length);
            handleInput();
            return;
          }

          if (/^\d+[\.\)]$/.test(trimmedPrefix)) {
            e.preventDefault();
            turnCurrentLineIntoList('ol', lineTextBefore.length);
            handleInput();
            return;
          }

          if (trimmedPrefix === '- [ ]' || trimmedPrefix === '* [ ]') {
            e.preventDefault();
            turnCurrentLineIntoList('task', lineTextBefore.length);
            handleInput();
            return;
          }
        }
      }
    }

    // Backspace to revert empty list item or empty task checkboxes
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        let liElement = container as HTMLElement;
        while (liElement && liElement.tagName !== 'LI') {
          liElement = liElement.parentElement as HTMLElement;
        }
        
        if (liElement) {
          const textContent = liElement.innerText || '';
          if (textContent.trim() === '') {
            e.preventDefault();
            const ul = liElement.parentElement;
            liElement.remove();
            
            const p = document.createElement('p');
            p.innerHTML = '<br>';

            if (ul) {
              ul.after(p);
              if (ul.children.length === 0) {
                ul.remove();
              }
            } else {
              editorRef.current?.appendChild(p);
            }

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.setEnd(p, 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
            handleInput();
            return;
          }
        }

        let taskRowElement = container as HTMLElement;
        while (taskRowElement && !taskRowElement.classList?.contains('task-item-row')) {
          taskRowElement = taskRowElement.parentElement as HTMLElement;
        }

        if (taskRowElement) {
          const textContent = taskRowElement.innerText || '';
          if (textContent.trim() === '') {
            e.preventDefault();
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            taskRowElement.replaceWith(p);

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.setEnd(p, 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
            handleInput();
            return;
          }
        }
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const row = checkbox.closest('.task-item-row');
      if (row) {
        row.setAttribute('data-task-status', checkbox.checked ? 'done' : 'todo');
      }
      handleInput();
    }
  };

  return (
    <div className="w-full border border-border rounded-xl bg-surface/60 dark:bg-night-sidebar/80 overflow-hidden flex flex-col transition-all">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-neutral-100/60 dark:bg-surface/60 text-xs">
        {!readOnly ? (
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {FORMAT_GROUPS.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {groupIdx > 0 && <span className="w-[1px] h-4 bg-border mx-1" />}
                {group.map((item) => (
                  <Tooltip key={item.command} delay={0} closeDelay={0}>
                    <Tooltip.Trigger>
                      <button
                        type="button"
                        onClick={() => applyFormat(item.command)}
                        className="p-1.5 rounded hover:bg-border/40 text-foreground transition-colors cursor-pointer flex items-center justify-center"
                        title={`${item.label} (${item.shortcut})`}
                      >
                        <item.icon className="size-3.5" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="top">
                      <div className="flex items-center gap-1.5 text-[11px] px-1 py-0.5">
                        <span className="font-semibold text-foreground">{item.label}</span>
                        <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-border/40 text-muted-foreground rounded border border-border/50">
                          {item.shortcut}
                        </kbd>
                      </div>
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-muted font-medium text-[11px] uppercase tracking-wider">
            Rich Text Viewer
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={handleEditorClick}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className="rich-text-editor-content w-full bg-transparent border-none outline-none text-xs md:text-sm text-foreground placeholder:text-muted/60 leading-relaxed"
        />
      </div>
    </div>
  );
}
