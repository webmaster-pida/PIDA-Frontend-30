import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; 
import { Exporter, getTimestampedName } from '../utils/exporter';

import { Box, TextField, Button, ButtonGroup, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, CircularProgress, Typography, Switch, FormControlLabel, ToggleButtonGroup, ToggleButton, Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import mermaid from 'mermaid';

const API_CHAT = import.meta.env.VITE_API_CHAT;

// Configuración global de Mermaid para garantizar responsividad nativa -prueba
mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: { useMaxWidth: true },
  sequence: { useMaxWidth: true },
  gantt: { useMaxWidth: true },
  journey: { useMaxWidth: true },
  class: { useMaxWidth: true },
  state: { useMaxWidth: true },
  er: { useMaxWidth: true },
  pie: { useMaxWidth: true }
});

// Silenciar errores por consola de Mermaid globales para evitar vibraciones o logs ruidosos durante el streaming
mermaid.parseError = () => {};

const PreviewLink = ({ href, children, node, title, ...props }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchedUrl, setFetchedUrl] = useState(null);
  const [isScrapeBlocked, setIsScrapeBlocked] = useState(false); 

  const MICROLINK_API_KEY = import.meta.env.VITE_MICROLINK_KEY || "";

  let hostname = "";
  try { hostname = new URL(href).hostname.replace('www.', ''); } catch (e) {}

  const fetchPreview = async () => {
    if (!href || !href.startsWith('http') || fetchedUrl === href) return;
    
    setFetchedUrl(href); 
    setLoading(true);
    setIsScrapeBlocked(false);

    try {
      const cleanHref = href.replace(/[\.\)]+$/, '');
      const res = await fetch(`https://pro.microlink.io?url=${encodeURIComponent(cleanHref)}`, {
        headers: MICROLINK_API_KEY ? { 'x-api-key': MICROLINK_API_KEY } : {}
      });
      
      const data = await res.json();

      if (data.status === 'success') {
        const returnedTitle = (data.data.title || '').toLowerCase();
        const blockedKeywords = ['error:', 'could not be satisfied', 'cloudflare', 'attention required', 'access denied', '403 forbidden', 'not acceptable', 'security check'];

        if (blockedKeywords.some(kw => returnedTitle.includes(kw))) {
          setIsScrapeBlocked(true); 
        } else {
          setPreviewData(data.data);
        }
      } else {
        setIsScrapeBlocked(true);
      }
    } catch (e) {
      setIsScrapeBlocked(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 1500);
    return () => clearTimeout(timer);
  }, [href]);

  return (
    <Tooltip
      placement="top"
      arrow
      enterDelay={100} 
      PopperProps={{ sx: { zIndex: 999999 } }}
      title={
        <Box sx={{ width: 380, p: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ color: '#60a5fa' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                  alt="icon" 
                  style={{ width: 16, height: 16, borderRadius: '2px', backgroundColor: 'white' }} 
                />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  {hostname}
                </Typography>
              </Box>

              {!isScrapeBlocked && previewData ? (
                <>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold', lineHeight: 1.3, color: 'white',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}
                  >
                    {previewData.title || "Fuente de información"}
                  </Typography>
                  {previewData.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.8rem', color: '#cbd5e1', mt: 0.5,
                        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4
                      }}
                    >
                      {previewData.description}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5, fontSize: '0.8rem' }}>
                  Documento Institucional Externo
                </Typography>
              )}
            </Box>
          )}
        </Box>
      }
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 420, maxHeight: 500, overflowY: 'auto',
            bgcolor: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
            borderRadius: '8px', border: '1px solid #334155', p: 1.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#334155', borderRadius: '10px' }
          }
        },
        arrow: { sx: { color: '#0f172a' } }
      }}
    >
      <span style={{ display: 'inline' }}>
        <a 
          href={href} target="_blank" rel="noopener noreferrer" 
          style={{ color: 'var(--pida-primary)', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
          {...props}
        >
          {children}
        </a>
      </span>
    </Tooltip>
  );
}

// Componente Helper para renderizar diagramas de Mermaid de forma asíncrona y responsiva
const MermaidChart = ({ chartCode, isTyping }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(false);
  const [isParsing, setIsParsing] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const containerId = useRef(`mermaid-container-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    setIsParsing(true);
    setError(false);

    const renderDiagram = async () => {
      try {
        let cleanCode = chartCode.trim();
        if (!cleanCode) return;

        // Forzar orientación vertical: reemplazar LR por TD
        cleanCode = cleanCode.replace(/(graph|flowchart)\s+LR/gi, '$1 TD');

        // Auto-corregir errores menores de sintaxis generados por el LLM antes de procesar
        cleanCode = cleanCode
          .replace(/--"/g, '--> ')
          .replace(/--\s*"/g, '--> ');

        // Validar sintaxis antes de renderizar usando try/catch y await mermaid.parse
        await mermaid.parse(cleanCode);

        // ID único por render para evitar conflictos de ID en el DOM de Mermaid
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleanCode);

        if (isMounted) {
          setSvgContent(svg);
          setError(false);
          setIsParsing(false);
        }
      } catch (err) {
        if (isMounted) {
          if (!isTyping) {
            setError(true);
            setIsParsing(false);
          } else {
            // Mientras esté escribiendo, mantenemos el estado de carga silenciosamente
            setError(false);
            setIsParsing(true);
          }
        }
      }
    };

    const timer = setTimeout(renderDiagram, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chartCode, isTyping]);

  if (error && !isTyping) {
    return (
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all', 
        backgroundColor: '#f1f5f9', 
        padding: '10px', 
        borderRadius: '8px',
        fontSize: '0.9em',
        color: '#334155'
      }}>
        <code>{chartCode}</code>
      </pre>
    );
  }

  if (isParsing || !svgContent) {
    return (
      <pre style={{ color: '#64748b', fontSize: '0.85em', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
        ⏳ Generando diagrama de flujo...
      </pre>
    );
  }

  return (
    <>
      <Box
        onClick={() => setOpenModal(true)}
        sx={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          cursor: 'pointer',
          position: 'relative',
          border: '1px solid transparent',
          borderRadius: '8px',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'var(--pida-primary)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            '& .zoom-overlay': {
              opacity: 1,
            }
          }
        }}
      >
        <style>{`
          #${containerId.current} svg {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
        `}</style>

        <Box
          className="zoom-overlay"
          sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            color: 'white',
            py: '4px',
            px: '8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🔍 Haz clic para ampliar
        </Box>

        <div 
          id={containerId.current}
          style={{
            width: '100%',
            maxWidth: '100%',
            display: 'block',
            margin: '15px 0',
            textAlign: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </Box>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#ffffff'
          }
        }}
        sx={{ zIndex: 9999999 }}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.2}
          maxScale={8}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Barra de herramientas flotante para controles de zoom */}
              <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1, zIndex: 10 }}>
                <Tooltip title="Acercar">
                  <IconButton
                    onClick={() => zoomIn()}
                    sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
                    size="small"
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Alejar">
                  <IconButton
                    onClick={() => zoomOut()}
                    sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
                    size="small"
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Restablecer tamaño">
                  <IconButton
                    onClick={() => resetTransform()}
                    sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
                    size="small"
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <IconButton
                onClick={() => setOpenModal(false)}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: '#F1F5F9',
                  zIndex: 10,
                  '&:hover': { bgcolor: '#E2E8F0' }
                }}
              >
                <CloseIcon />
              </IconButton>

              <DialogContent 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  overflow: 'hidden',
                  height: '75vh',
                  maxHeight: '85vh',
                  p: 4,
                  mt: 6,
                  bgcolor: '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                  contentStyle={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      '& svg': {
                        width: '100% !important',
                        maxWidth: 'none !important',
                        height: 'auto !important',
                        maxHeight: '70vh !important'
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </TransformComponent>
              </DialogContent>
            </>
          )}
        </TransformWrapper>
      </Dialog>
    </>
  );
};

const MinimizableStatusLog = ({ content, isTyping, hasContent }) => {
  const [isOpen, setIsOpen] = useState(true);
  const lines = (content || '').split('\n')
    .filter(line => line.trim() !== '')
    .map((line, i) => ({
      id: `status-${i}`,
      text: line
    }));

  return (
    <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        <Button onClick={() => setIsOpen(!isOpen)} size="small" sx={{ color: 'text.secondary', textTransform: 'none', minWidth: 0, p: 0 }}>
          {isOpen ? 'Ocultar progreso' : 'Ver progreso'}
        </Button>
      </Box>
      {isOpen && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.8, 
            pl: 2, 
            ml: 1, 
            borderLeft: '2px solid #e2e8f0',
            // Eliminamos maxHeight y overflowY para evitar el scroll interno
            pr: 1,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          {lines.map((item) => {
            const isSubItem = /^[\s\-•]/.test(item.text);
            const text = item.text.replace(/^[\s\-•]+/, '');
            return (
              <Typography 
                key={item.id} 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  color: isSubItem ? 'text.secondary' : 'text.primary', 
                  fontWeight: isSubItem ? 400 : 600,
                  gap: 1, 
                  ml: isSubItem ? 3 : 0 
                }}
              >
                {!isSubItem && <span style={{ color: 'var(--pida-primary)', marginTop: '2px' }}>✓</span>}
                {isSubItem && <span style={{ color: '#94a3b8', fontSize: '1.2em', lineHeight: '14px' }}>•</span>}
                <span style={{ pt: '1px' }}>{text}</span>
              </Typography>
            );
          })}
          
          {/* Spinner de "Pensando..." que desaparece cuando llega el texto */}
          {isTyping && !hasContent && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5, mt: 0.5 }}>
              <CircularProgress size={14} sx={{ color: 'var(--pida-primary)' }}/>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'var(--pida-primary)', fontStyle: 'italic' }}>
                Procesando información y estructurando análisis...
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const markdownComponents = {
  a: ({ node, ...props }) => <PreviewLink href={props.href} {...props}>{props.children}</PreviewLink>,
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-([\w-]+)/.exec(className || '');
    
    if (!inline && match && match[1] === 'mermaid') {
      return <MermaidChart chartCode={String(children)} />;
    }
    
    return (
      <code 
        className={className} 
        style={{ 
          backgroundColor: '#f1f5f9', 
          padding: '2px 4px', 
          borderRadius: '4px', 
          fontSize: '0.9em',
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-all'
        }} 
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, children, ...props }) => {
    // Evita renderizar fondo gris o marcos de código para diagramas de Mermaid
    const isMermaid = children && React.isValidElement(children) && children.props.className?.includes('language-mermaid');
    if (isMermaid) {
      return <>{children}</>;
    }
    return (
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all', 
        overflowX: 'hidden', 
        maxWidth: '100%', 
        backgroundColor: '#f1f5f9', 
        padding: '10px', 
        borderRadius: '8px' 
      }} {...props}>
        {children}
      </pre>
    );
  },
  table: ({ node, ...props }) => (
    <div style={{ display: 'block', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          width: '100%', 
          my: 2, 
          boxShadow: 'none', 
          border: '1px solid var(--pida-border, #e2e8f0)', 
          borderRadius: '8px',
          bgcolor: 'var(--pida-bg-white, #ffffff)',
          color: 'var(--pida-text-main, inherit)'
        }}
      >
        <Table size="small" sx={{ minWidth: 600 }} {...props} />
      </TableContainer>
    </div>
  ),
  thead: ({ node, ...props }) => <TableHead sx={{ bgcolor: 'var(--pida-bg-app, #f1f5f9)' }} {...props} />,
  tbody: ({ node, ...props }) => <TableBody {...props} />,
  tr: ({ node, ...props }) => <TableRow hover {...props} />,
  th: ({ node, ...props }) => (
    <TableCell 
      sx={{ 
        fontWeight: 'bold', 
        color: 'var(--pida-primary, #101852)', 
        borderBottom: '2px solid var(--pida-border, #cbd5e1)',
        whiteSpace: 'normal',
        lineHeight: 1.3,
        bgcolor: 'var(--pida-bg-app, #f1f5f9)',
        borderColor: 'var(--pida-border, #e2e8f0)'
      }} 
      {...props} 
    />
  ),
  td: ({ node, ...props }) => (
    <TableCell 
      sx={{ 
        borderColor: 'var(--pida-border, #e2e8f0)',
        verticalAlign: 'top',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        color: 'var(--pida-text-main, inherit)'
      }} 
      {...props} 
    />
  )
};

export default function ChatInterface({ user, resetSignal, loadChatId, refreshHistory, isResearchModeProp = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [isResearchMode, setIsResearchMode] = useState(isResearchModeProp);
  const [researchStatuses, setResearchStatuses] = useState([]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageModel = lastMessage && lastMessage.role === 'model';
  const isLastMessageEmpty = !lastMessage || lastMessage.content === '';

  // Interceptador dinámico de componentes Markdown para inyectar 'isTyping' a MermaidChart
  const customMarkdownComponents = React.useMemo(() => ({
    ...markdownComponents,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-([\w-]+)/.exec(className || '');
      
      if (!inline && match && match[1] === 'mermaid') {
        return <MermaidChart chartCode={String(children)} isTyping={isTyping} />;
      }
      
      return markdownComponents.code({ node, inline, className, children, ...props });
    }
  }), [isTyping]);

  const formatMarkdown = (text) => {
    if (!text) return "";
    
    // Dividimos el texto en segmentos de código de Mermaid y texto markdown normal
    const segments = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      const mermaidStartIndex = text.indexOf('```mermaid', currentIndex);
      if (mermaidStartIndex === -1) {
        segments.push({ type: 'text', content: text.substring(currentIndex) });
        break;
      }
      
      if (mermaidStartIndex > currentIndex) {
        segments.push({ type: 'text', content: text.substring(currentIndex, mermaidStartIndex) });
      }
      
      const mermaidEndIndex = text.indexOf('```', mermaidStartIndex + 10);
      if (mermaidEndIndex === -1) {
        // Bloque de Mermaid incompleto (streaming en curso)
        segments.push({ type: 'mermaid', content: text.substring(mermaidStartIndex) });
        break;
      } else {
        const endPos = mermaidEndIndex + 3;
        segments.push({ type: 'mermaid', content: text.substring(mermaidStartIndex, endPos) });
        currentIndex = endPos;
      }
    }
    
    const processed = segments.map(seg => {
      if (seg.type === 'mermaid') {
        return seg.content; // Se mantiene el bloque Mermaid intacto para evitar romper saltos de línea
      }
      
      const lines = seg.content.split('\n');
      const formattedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        const trimmedCurrent = currentLine.trim();
        const isCurrentTable = trimmedCurrent.startsWith('|') && trimmedCurrent.endsWith('|');
        
        if (isCurrentTable) {
          if (formattedLines.length > 0) {
            const prevLine = formattedLines[formattedLines.length - 1];
            const trimmedPrev = prevLine.trim();
            const isPrevTable = trimmedPrev.startsWith('|') && trimmedPrev.endsWith('|');
            if (trimmedPrev !== "" && !isPrevTable) {
              formattedLines.push("");
            }
          }
        } else {
          if (formattedLines.length > 0 && trimmedCurrent !== "") {
            const prevLine = formattedLines[formattedLines.length - 1];
            const trimmedPrev = prevLine.trim();
            const isPrevTable = trimmedPrev.startsWith('|') && trimmedPrev.endsWith('|');
            if (isPrevTable) {
              formattedLines.push("");
            }
          }
        }
        formattedLines.push(currentLine);
      }
      
      let clean = formattedLines.join('\n');
      clean = clean.replace(/([^\n])\s*\n*(#{1,6}\s+)/g, '$1\n\n$2');
      clean = clean.replace(/^\s*\*\*\s*$/gm, '');
      return clean;
    });
    
    return processed.join('');
  };

  // Función de utilidad para estructurar el progreso de investigación profunda en Markdown
  const formatResearchProgress = (data) => {
    let md = `**Investigación Profunda en curso...**\n\n`;
    
    if (data.status_message) {
      md += `*Estado:* **${data.status_message}**\n\n`;
    }
    
    if (data.steps && data.steps.length > 0) {
      md += `**Fases y progreso:**\n`;
      data.steps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += `\n`;
    }
    
    if (data.documents_consulted && data.documents_consulted.length > 0) {
      md += `**Documentos de biblioteca analizados (RAG):**\n`;
      data.documents_consulted.forEach(doc => {
        md += `- *${doc}*\n`;
      });
      md += `\n`;
    }
    
    if (data.websites_consulted && data.websites_consulted.length > 0) {
      md += `**Sitios web e informes consultados:**\n`;
      data.websites_consulted.forEach(site => {
        md += `- ${site}\n`;
      });
      md += `\n`;
    }
    
    md += `*Este proceso puede tomar de 2 a 5 minutos. Puedes seguir usando PIDA o cerrar esta ventana; el reporte se guardará en tu historial de forma segura.*\n\n`;
    md += `*PIDA está investigando y redactando el informe en segundo plano...* <span class="inline-spinner"></span>`;
    return md;
  };

  useEffect(() => {
    if (!isTyping && questionQueue.length > 0) {
      const nextQuestion = questionQueue[0];
      
      // La sacamos de la fila
      setQuestionQueue(prev => prev.slice(1));
      
      // La enviamos simulando el evento
      handleSend(null, nextQuestion);
    }
  }, [isTyping, questionQueue]);
  
  const [currentStatus, setCurrentStatus] = useState('Iniciando...'); 
  const [statusQueue, setStatusQueue] = useState([]);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      setIsAtBottom(distanceToBottom < 80);
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // NUEVO SISTEMA DE SCROLL REACTIVO
  useEffect(() => {
    const chatBox = document.getElementById('pida-chat-box');
    if (!chatBox) return;

    const observer = new ResizeObserver(() => {
      if (isAtBottom && messagesEndRef.current) {
        // Truco premium: 'auto' (instantáneo) mientras escribe/dibuja para no 
        // encolar animaciones, y 'smooth' solo cuando el usuario navega o envía.
        messagesEndRef.current.scrollIntoView({ 
          behavior: isTyping ? 'auto' : 'smooth', 
          block: 'end' 
        });
      }
    });

    observer.observe(chatBox);

    return () => observer.disconnect();
  }, [isAtBottom, isTyping]);

  // EFECTO: PROCESADOR DE COLA DE ESTADOS VISUALES
  useEffect(() => {
    if (statusQueue.length > 0 && !isProcessingStatus) {
      setIsProcessingStatus(true);
      setCurrentStatus(statusQueue[0]); 
      
      setTimeout(() => {
        setStatusQueue(prev => prev.slice(1)); 
        setIsProcessingStatus(false); 
      }, 1200); 
    }
  }, [statusQueue, isProcessingStatus]);

  useEffect(() => {
    if (resetSignal > 0) {
      setMessages([]);
      setChatId(null);
      setInput('');
      setIsAtBottom(true);
      setStatusQueue([]);
      setIsProcessingStatus(false);
      setResearchStatuses([]);
    }
  }, [resetSignal]);

  useEffect(() => {
    if (loadChatId) {
      const loadPastChat = async () => {
        try {
          const token = await user.getIdToken();
          const res = await fetch(`${API_CHAT}/conversations/${loadChatId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const msgs = await res.json();
          setChatId(loadChatId);
          setMessages(msgs);
          setIsAtBottom(true);
          setTimeout(() => scrollToBottom('auto'), 100);
        } catch (err) {
          console.error("Error cargando chat", err);
        }
      };
      loadPastChat();
    }
  }, [loadChatId, user]);

  const startConversation = async () => {
    const token = await user.getIdToken();
    const res = await fetch(`${API_CHAT}/conversations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "Nuevo Chat" })
    });
    
    if (!res.ok) throw new Error(res.status === 403 ? "Suscripción inactiva." : "Error al crear la conversación.");
    
    const data = await res.json();
    setChatId(data.id);
    return data.id;
  };

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    
    const textToSend = textOverride || input.trim();
    if (!textToSend || isTyping) return;

    if (!textOverride) setInput('');
    
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: textToSend },
      { role: 'model', content: '' } // Creamos la burbuja de PIDA inmediatamente
    ]);
    setIsTyping(true);
    setCurrentStatus('Conectando...');
    setStatusQueue([]); 
    setResearchStatuses([]);
    
    setIsAtBottom(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      let currentChatId = chatId;
      let isNewConversation = false;
      
      if (!currentChatId) {
        currentChatId = await startConversation();
        isNewConversation = true; 
      }

      const token = await user.getIdToken();
      
      if (isNewConversation) {
        try {
          await fetch(`${API_CHAT}/conversations/${currentChatId}/title`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: textToSend })
          });
          if (refreshHistory) refreshHistory();
        } catch (err) {
          console.error("Error actualizando título:", err);
        }
      }

        const res = await fetch(`${API_CHAT}/chat-stream/${currentChatId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: textToSend,
            mode: isResearchMode ? "deep_research" : "chat"
          })
        });

        if (!res.ok) {
          if (res.status === 403 || res.status === 402 || res.status === 429) {
               throw new Error("Has alcanzado tu límite de consultas o tu suscripción no está activa.");
          }
          throw new Error(`Error del servidor (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let streamBuffer = ""; // Búfer para no romper JSONs cortados por la red

        // --- INICIO DE LÓGICA DE COLA DE ESCRITURA ---
        const textQueue = { current: "" };
        let isTypingEffectActive = false;

        const typeWriterEffect = async () => {
          isTypingEffectActive = true;
          let lastRenderTime = Date.now(); // Control para no saturar a React (CPU)
          
          while (textQueue.current.length > 0) {
            const qLen = textQueue.current.length;
            
            // ACELERADOR INTELIGENTE
            let chunkSize = 1;
            let delay = 15;
            
            if (qLen > 150) { 
              chunkSize = 4; delay = 10; // Red rápida: Aceleramos tipeo
            } else if (qLen > 50) { 
              chunkSize = 2; delay = 12; // Velocidad normal
            } else if (qLen < 15) { 
              chunkSize = 1; delay = 35; // Red lenta: Frenamos para no hacer pausas bruscas
            }
            
            const chunk = textQueue.current.substring(0, chunkSize);
            textQueue.current = textQueue.current.substring(chunkSize);
            fullText += chunk;

            // SALVATAJE DE CPU: Actualizamos Markdown solo cada 40ms
            const now = Date.now();
            if (now - lastRenderTime > 40 || textQueue.current.length === 0) {
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'model') {
                    return [...prev.slice(0, -1), { ...lastMsg, content: fullText }];
                } else {
                    return [...prev, { role: 'model', content: fullText }];
                }
              });
              lastRenderTime = now;
            }

            // Micro-retraso visual
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          isTypingEffectActive = false;
        };
        // --- FIN DE LÓGICA DE COLA ---

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split('\n\n');
          streamBuffer = lines.pop(); // Guarda el último pedazo incompleto para el siguiente ciclo
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.event === 'status' && data.message) {
                  if (isResearchMode) {
                    setResearchStatuses(prev => {
                      if (prev.includes(data.message)) return prev;
                      if (prev.length > 0) {
                        const lastItem = prev[prev.length - 1];
                        if (data.message.startsWith(lastItem)) {
                          return [...prev.slice(0, -1), data.message];
                        }
                        if (lastItem.startsWith(data.message)) {
                          return prev;
                        }
                      }
                      return [...prev, data.message];
                    });
                  } else {
                    setStatusQueue(prev => [...prev, data.message]);
                  }
                } 
                else if (data.text) {
                  // Guardamos en la cola en lugar de frenar la red
                  textQueue.current += data.text;
                  
                  // Si el escritor está dormido, lo despertamos
                  if (!isTypingEffectActive) {
                    typeWriterEffect();
                  }
                }
              } catch (e) {
                // Ignorar errores parciales de JSON de forma segura
              }
            }
          }
        }

        while (isTypingEffectActive || textQueue.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: `❌ **Ocurrió un problema:** ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBackendDownload = async (format) => {
    if (!chatId) {
      alert("Por favor, interactúa en el chat antes de descargarlo.");
      return;
    }
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("convo_id", chatId);
      formData.append("file_format", format);

      const res = await fetch(`${API_CHAT}/download-chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Error en el servidor al generar el documento.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${getTimestampedName("Experto_PIDA")}.${format}`; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Hubo un problema descargando el archivo.");
    }
  };

  const handleTXTDownload = () => {
    const cleanMessages = messages.map(msg => {
      if (msg.role !== 'model') return msg;
      
      let content = msg.content.replace(/_Fin del análisis\._/g, "");
      
      content = content.replace(/<pida_questions>([\s\S]*?)<\/pida_questions>/g, (match, p1) => {
          const qs = p1.split('|').map(q => q.trim()).filter(q => q);
          if (qs.length === 0) return "";
          return "\n\nPreguntas de seguimiento sugeridas:\n" + qs.map(q => `- ${q}`).join('\n');
      });

      content = content.replace(/^\|?[\s\-:]+\|[\s\-:|]+$/gm, "");

      content = content.replace(/\|/g, " - ");

      content = content.replace(/\*\*/g, "");

      return { ...msg, content };
    });

    Exporter.downloadTXT(getTimestampedName("Experto_PIDA"), "Reporte Experto Jurídico", cleanMessages);
  };

  const handleFollowUpClick = (question) => {
    if (isTyping) {
      // Si el bot está escribiendo, la formamos en la cola
      setQuestionQueue(prev => [...prev, question]);
    } else {
      // Si está libre, la ejecutamos
      handleSend(null, question);
    }
  };
  
  const renderMessageContent = (msg, index) => {
    if (msg.role === 'user') {
      return (
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={customMarkdownComponents}>{formatMarkdown(msg.content)}</ReactMarkdown>
        </div>
      );
    }

    const isCurrentlyTypingThis = isTyping && index === messages.length - 1;
    let displayContent = msg.content;

    let statusLogContent = null;
    const logRegex = /<pida_status_log>([\s\S]*?)(?:<\/pida_status_log>|$)/i;

    // 1. Si está escribiendo, usamos SIEMPRE el estado en vivo (fluidez perfecta)
    if (isCurrentlyTypingThis && researchStatuses.length > 0) {
      statusLogContent = researchStatuses.join('\n');
    }

    // 2. Extraer y limpiar el texto que viene del servidor (evita que se imprima la etiqueta)
    const matchLog = displayContent.match(logRegex);
    if (matchLog) {
      // Si ya terminó de escribir, nos pasamos a la versión consolidada del historial
      if (!isCurrentlyTypingThis) {
        statusLogContent = matchLog[1].trim();
      }
      // Removemos la etiqueta del texto visible siempre
      displayContent = displayContent.replace(logRegex, "");
    }

    // 3. Limpieza de máquina de escribir: Si una etiqueta a medio formar se cuela, la borramos visualmente
    if (isCurrentlyTypingThis) {
      displayContent = displayContent.replace(/<\/?(?:p(?:i(?:d(?:a(?:_[a-zA-Z0-9_]*)?)?)?)?)?$/i, "");
    }

        // Procesamos las líneas para corregir negritas incompletas, pero manteniendo intactos los bloques de Mermaid
        const segments = [];
        let currentIndex = 0;
        while (currentIndex < displayContent.length) {
          const mStart = displayContent.indexOf('```mermaid', currentIndex);
          if (mStart === -1) {
            segments.push({ type: 'text', content: displayContent.substring(currentIndex) });
            break;
      }
          if (mStart > currentIndex) {
            segments.push({ type: 'text', content: displayContent.substring(currentIndex, mStart) });
          }
          const mEnd = displayContent.indexOf('```', mStart + 10);
          if (mEnd === -1) {
            segments.push({ type: 'mermaid', content: displayContent.substring(mStart) });
            break;
          } else {
            const endPos = mEnd + 3;
            segments.push({ type: 'mermaid', content: displayContent.substring(mStart, endPos) });
            currentIndex = endPos;
          }
        }

        displayContent = segments.map(seg => {
          if (seg.type === 'mermaid') {
            return seg.content;
          }
          return seg.content.split('\n').map(line => {
            const count = (line.match(/\*\*/g) || []).length;
            if (count % 2 !== 0) {
              return line.replace(/\*\*/g, ''); 
            }
            return line;
          }).join('\n');
    }).join('\n');

    let questions = [];

    const tagStart = "<pida_questions>";
    const tagEnd = "</pida_questions>";

    if (displayContent.includes(tagStart)) {
      const parts = displayContent.split(tagStart);
      let textBeforeTags = parts[0];
      let textInsideAndAfter = parts[1] || "";
      
      let qString = "";
      let textAfterTags = ""; 

      if (textInsideAndAfter.includes(tagEnd)) {
        const subParts = textInsideAndAfter.split(tagEnd);
        qString = subParts[0]; 
        textAfterTags = subParts.slice(1).join(tagEnd); 
      } else {
        // 👇 CAMBIO 1: Si estamos en pleno stream y la etiqueta no se ha cerrado, 
        // mantenemos los strings vacíos para ocultar el código basura.
        qString = "";
        textAfterTags = "";
      }

      displayContent = textBeforeTags + "\n" + textAfterTags;

      // 👇 CAMBIO 2: Solo procesamos y dibujamos los botones si el bot YA TERMINÓ
      // de escribir, o si la etiqueta ya llegó completa.
      if (!isCurrentlyTypingThis || textInsideAndAfter.includes(tagEnd)) {
        questions = qString.split('|').map(q => q.trim()).filter(q => q.length > 0);
      } else {
        questions = []; // Mantenemos oculta la botonera
      }
    }

    displayContent = displayContent.replace(/["']br["']/g, '<br />');

    return (
      <>
        {statusLogContent && (
          <MinimizableStatusLog 
            content={statusLogContent} 
            hasContent={displayContent.trim().length > 0} 
            isTyping={isCurrentlyTypingThis} 
          />
        )}
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={customMarkdownComponents}>
            {formatMarkdown(displayContent)}
          </ReactMarkdown>
        </div>
        
        {questions.length > 0 && (
          <div className="follow-up-section">
            <strong style={{ display: 'block', marginTop: '15px', marginBottom: '10px', color: 'var(--pida-primary)' }}>
              Preguntas de seguimiento sugeridas:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {questions.map((q, i) => (
                <button 
                  key={i} 
                  className="follow-up-btn"
                  onClick={() => handleFollowUpClick(q)}
                  disabled={questionQueue.includes(q)}
                  style={{ opacity: questionQueue.includes(q) ? 0.6 : 1 }}
                >
                  {questionQueue.includes(q) ? `⏳ En cola: ${q}` : q}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="pida-view" style={{ position: 'relative' }}>
      
      <div className="pida-view-content" ref={chatContainerRef} onScroll={handleScroll}>
        <div id="pida-chat-box">
          
          {messages.length === 0 && (
            <div className="pida-bubble pida-message-bubble">
              <div className="pida-welcome-content">
                <div className="pida-welcome-text">
                  <h3>¡Hola! Soy PIDA, tu asistente experto en Derechos Humanos y temas afines.</h3>
                  <p style={{ color: 'var(--text)'}}>Estoy para apoyarte y responder cualquier pregunta que me hagas, incluyendo investigaciones, análisis de casos, búsqueda de jurisprudencia y redacción legal de todo tipo de documentos, cartas, informes, elaboración de proyectos y seguimiento y monitoreo.</p>
                  <strong style={{ color: 'var(--pida-primary)'}}>¿Qué te gustaría pedirme ahora?</strong>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`pida-bubble ${msg.role === 'user' ? 'user-message-bubble' : 'pida-message-bubble'}`}>
              {renderMessageContent(msg, idx)}
            </div>
          ))}

          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>
      </div>

      {!isAtBottom && messages.length > 0 && (
        <Fab
          color="primary"
          size="medium"
          onClick={(e) => {
            e.preventDefault();
            setIsAtBottom(true);
            scrollToBottom();
          }}
          sx={{
            position: 'absolute',
            bottom: '120px',
            right: '25px',
            zIndex: 900,
            opacity: 0.9,
            backgroundColor: 'var(--pida-primary)',
            '&:hover': { backgroundColor: 'var(--pida-accent)', opacity: 1 }
          }}
          title="Ir al último mensaje"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </Fab>
      )}

      <form className="pida-view-form" onSubmit={(e) => handleSend(e)}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: messages.length > 0 ? -1.5 : 0 }}>
          <ToggleButtonGroup
            value={isResearchMode ? 'deep_research' : 'chat'}
            exclusive
            onChange={(event, newMode) => {
              if (newMode !== null) {
                const targetResearch = newMode === 'deep_research';
                if (targetResearch !== isResearchMode) {
                  setIsResearchMode(targetResearch);
                  setMessages([]);
                  setChatId(null);
                  setInput('');
                  setQuestionQueue([]);
                  setResearchStatuses([]);
                  setIsAtBottom(true);
                }
              }
            }}
            size="small"
            sx={{
              bgcolor: '#f1f5f9',
              p: 0.5,
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              width: { xs: '100%', sm: 'auto' },
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: '6px !important',
                mx: 0.5,
                flexGrow: { xs: 1, sm: 0 },
                px: { xs: 1.5, sm: 2.5 },
                py: 0.5,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 700,
                textTransform: 'none',
                color: '#475569',
                whiteSpace: 'nowrap',
                '&.Mui-selected': {
                  bgcolor: 'white',
                  color: 'var(--pida-primary, #101852)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  '&:hover': {
                    bgcolor: 'white',
                  }
                },
                '&:hover': {
                  bgcolor: '#e2e8f0',
                }
              }
            }}
          >
            <ToggleButton value="chat">Chat Experto</ToggleButton>
            <ToggleButton value="deep_research">Investigación Profunda</ToggleButton>
          </ToggleButtonGroup>

          {messages.length > 0 && (
            <ButtonGroup size="small" variant="outlined" color="inherit" sx={{ borderColor: '#e2e8f0', bgcolor: 'white' }}>
              <Button sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }} onClick={handleTXTDownload}>TXT</Button>
              <Button sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }} onClick={() => handleBackendDownload('docx')}>DOCX</Button>
              <Button sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }} onClick={() => handleBackendDownload('pdf')}>PDF</Button>
            </ButtonGroup>
          )}
        </Box>

        <TextField 
          multiline
          minRows={2}
          maxRows={5}
          fullWidth
          placeholder={isResearchMode ? "Ingresa tu tema para investigación profunda..." : "Consulta a PIDA..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
          sx={{ 
            mb: 2, 
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FAFAFA',
              borderRadius: 2,
            }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="text" 
            onClick={() => { setMessages([]); setChatId(null); setInput(''); setIsAtBottom(true); }}
            sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' } }}
          >
            Limpiar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isTyping}
            sx={{ width: 220, py: 1.2, borderRadius: 2, fontWeight: 600, bgcolor: 'var(--pida-primary)', '&:hover': { bgcolor: 'var(--pida-accent)' } }}
          >
            {isResearchMode ? 'Investigar' : 'Enviar'}
          </Button>
        </Box>
      </form>
    </div>
  );
}