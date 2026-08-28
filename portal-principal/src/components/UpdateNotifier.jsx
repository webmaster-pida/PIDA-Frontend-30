import React, { useState, useEffect } from 'react';

export default function UpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Si estamos programando en local (localhost), no queremos que salte esto.
    if (import.meta.env.DEV) return;

    let currentScriptHash = null;
    
    // 1. Buscamos qué versión de JavaScript tiene cargada el usuario actualmente
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('/assets/index-')) {
        currentScriptHash = src;
        break;
      }
    }

    // 2. Función silenciosa que "pregunta" al servidor si hay una nueva versión
    const checkForUpdates = async () => {
      if (!currentScriptHash || hasUpdate) return;
      try {
        // Hacemos un fetch a la raíz engañando al caché con la hora actual
        const res = await fetch(`/?t=${new Date().getTime()}`);
        if (!res.ok) return;
        const html = await res.text();
        
        // Buscamos el nombre del script que está vivo AHORA MISMO en Firebase
        const match = html.match(/\/assets\/index-[a-zA-Z0-9_-]+\.js/);
        
        if (match && match[0]) {
          const newScriptHash = match[0];
          // Si el de Firebase es diferente al que tiene el usuario... ¡Hay actualización!
          if (!currentScriptHash.includes(newScriptHash)) {
            setHasUpdate(true);
          }
        }
      } catch (error) {
        // Ignoramos errores de red (ej. si el usuario pierde el internet un momento)
      }
    };

    // 3. Revisar cada 10 minutos automáticamente
    const intervalId = setInterval(checkForUpdates, 10 * 60 * 1000);
    
    // 4. Revisar también cada vez que el usuario cambie de pestaña y vuelva a PIDA
    window.addEventListener('focus', checkForUpdates);

    // Limpieza al desmontar
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, [hasUpdate]);

  // Si no hay actualización o el usuario lo cerró, no renderizamos nada
  if (!hasUpdate || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(5px)',
      zIndex: 999999999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUpModal {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      <div style={{
        background: 'var(--pida-bg-white, #ffffff)',
        width: '90%',
        maxWidth: '480px',
        borderRadius: '12px',
        padding: '35px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        textAlign: 'center',
        border: '1px solid var(--pida-border, #E5E7EB)',
        animation: 'slideUpModal 0.4s ease-out'
      }}>
        <button 
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'var(--pida-bg-app, #f1f5f9)',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            fontSize: '18px',
            color: 'var(--pida-text-muted, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--pida-border, #e2e8f0)'; e.currentTarget.style.color = 'var(--pida-text-main, #0f172a)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--pida-bg-app, #f1f5f9)'; e.currentTarget.style.color = 'var(--pida-text-muted, #64748b)'; }}
          title="Cerrar y continuar trabajando"
        >
          ✕
        </button>
        
        <div style={{
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          background: 'var(--pida-hover-bg, rgba(0, 195, 255, 0.1))',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 20px',
          overflow: 'hidden'
        }}>
          <img 
            src="/img/PIDA-MASCOTA-Trans-menu-peq.png" 
            alt="Mascota PIDA" 
            style={{ width: '80%', height: '80%', objectFit: 'contain' }} 
          />
        </div>

        <h2 style={{
          color: 'var(--pida-interactive, #101852)',
          fontSize: '1.4rem',
          fontWeight: '800',
          marginBottom: '15px'
        }}>
          ¡Nueva versión disponible!
        </h2>
        
        <p style={{
          color: 'var(--pida-text-main, #555555)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '15px',
          textAlign: 'left'
        }}>
          Hemos lanzado una nueva actualización con mejoras y correcciones. 
          Puedes actualizar ahora mismo o el sistema se actualizará automáticamente 
          la próxima vez que <strong>refresques</strong> o <strong>reinicies tu navegador</strong>.
        </p>

        <p style={{
          color: 'var(--pida-text-muted, #6B7280)',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          marginBottom: '25px',
          textAlign: 'left',
          background: 'var(--pida-bg-app, #f8fafc)',
          padding: '12px',
          borderRadius: '0px 4px 4px 0px',
          borderLeft: '4px solid var(--red, #e36946)'
        }}>
          <strong>💡 Sugerencia:</strong> Si estás trabajando en algo importante, puedes cerrar este mensaje 
          haciendo clic en la "X" y refrescar la página más tarde para no perder tu progreso actual.
        </p>

        <button 
          onClick={() => window.location.reload(true)}
          style={{
            backgroundColor: 'var(--pida-interactive, #101852)',
            color: 'var(--navy-dark, #ffffff)',
            border: 'none',
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            transition: 'background 0.2s, transform 0.2s',
            boxShadow: '0 4px 12px rgba(16, 24, 82, 0.2)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--pida-accent, #003399)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--pida-interactive, #101852)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}