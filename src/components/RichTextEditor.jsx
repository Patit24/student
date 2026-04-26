import React, { useRef, useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  // Sync external value to editor (only if it's different to prevent cursor jumps)
  useEffect(() => {
    // Force P tags for new lines
    document.execCommand('defaultParagraphSeparator', false, 'p');
    
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  return (
    <div className="rich-editor-wrapper flex-col gap-2">
      {/* Basic Formatting Toolbar */}
      <div className="editor-toolbar flex gap-2 p-2 bg-white/5 border border-white/10 rounded-t-xl overflow-x-auto">
        <button type="button" onClick={() => execCommand('bold')} className="toolbar-btn" title="Bold">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="toolbar-btn" title="Italic">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="toolbar-btn" title="Underline">U</button>
        <div className="toolbar-divider" />
        <button type="button" onClick={() => execCommand('formatBlock', 'H1')} className="toolbar-btn" title="Heading 1">H1</button>
        <button type="button" onClick={() => execCommand('formatBlock', 'H2')} className="toolbar-btn" title="Heading 2">H2</button>
        <button type="button" onClick={() => execCommand('formatBlock', 'P')} className="toolbar-btn" title="Paragraph">P</button>
        <div className="toolbar-divider" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Bullet List">• List</button>
        <button type="button" onClick={() => execCommand('justifyLeft')} className="toolbar-btn">L</button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="toolbar-btn">C</button>
        <button type="button" onClick={() => execCommand('foreColor', prompt('Enter color hex (e.g. #F5C518):'))} className="toolbar-btn" title="Text Color">🎨</button>
        <button type="button" onClick={() => {
          const url = prompt('Enter URL:');
          if (url) execCommand('createLink', url);
        }} className="toolbar-btn" title="Link">🔗</button>
        <button type="button" onClick={() => execCommand('removeFormat')} className="toolbar-btn" title="Clear Format">✕</button>
      </div>

      {/* Cinematic Editing Surface */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="input-field rich-editor-surface"
        style={{ 
          minHeight: '400px', 
          height: 'auto', 
          padding: '2rem',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          overflowY: 'auto',
          lineHeight: 1.8,
          background: 'rgba(255,255,255,0.02)'
        }}
        data-placeholder={placeholder}
      />

      <style>
        {`
          .toolbar-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .toolbar-btn:hover {
            background: var(--hp-yellow);
            color: #000;
          }
          .toolbar-divider {
            width: 1px;
            height: 20px;
            background: rgba(255,255,255,0.1);
            margin: auto 4px;
          }
          .rich-editor-surface:empty:before {
            content: attr(data-placeholder);
            color: rgba(255,255,255,0.3);
            pointer-events: none;
          }
                    .rich-editor-surface h1 { font-size: 2.5rem !important; font-weight: 900 !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; color: #fff !important; line-height: 1.2 !important; }
                    .rich-editor-surface h2 { font-size: 1.8rem !important; font-weight: 800 !important; margin-bottom: 1.2rem !important; margin-top: 1.8rem !important; color: #fff !important; line-height: 1.3 !important; }
                    .rich-editor-surface h3 { font-size: 1.4rem !important; font-weight: 700 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: #fff !important; }
                    .rich-editor-surface p, .rich-editor-surface div { margin-bottom: 1.5rem !important; min-height: 1.5em !important; line-height: 1.8 !important; }
                    .rich-editor-surface ul, .rich-editor-surface ol { padding-left: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .rich-editor-surface li { margin-bottom: 0.5rem !important; }
                    .rich-editor-surface b, .rich-editor-surface strong { font-weight: 900 !important; color: #fff !important; }
        `}
      </style>
    </div>
  );
}
