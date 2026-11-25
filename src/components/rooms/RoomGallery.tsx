import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CameraOff, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

interface RoomGalleryProps {
  gallery: string[];
  roomName: string;
  isID: boolean;
  loading: boolean;
  illustrated: boolean;
}

const arrow = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/25 bg-[#132442]/90 text-white hover:bg-[#132442] motion-safe:transition-colors';
const caption = 'rounded-full bg-[#132442]/90 px-3 py-1.5 text-xs font-bold text-white';

function GalleryPhoto({ source, alt, className, priority = false }: { source: string; alt: string; className?: string; priority?: boolean }) {
  const [broken, setBroken] = useState(false);
  return broken
    ? <span className={'grid size-full place-items-center bg-navy-soft text-navy-dark ' + (className ?? '')}><CameraOff className="size-6" aria-hidden /></span>
    : <img src={source} alt={alt} fetchPriority={priority ? 'high' : 'auto'} onError={() => setBroken(true)} className={'size-full ' + (className ?? '')} />;
}

function RoomPhotoDialog({ gallery, index, roomName, isID, illustrated, onChange, onClose }: {
  gallery: string[];
  index: number;
  roomName: string;
  isID: boolean;
  illustrated: boolean;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = originalOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const prev = () => onChange((index - 1 + gallery.length) % gallery.length);
  const next = () => onChange((index + 1) % gallery.length);

  return (
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={event => {
        if (gallery.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'ArrowLeft') prev();
        else next();
      }}
      className="room-detail-page fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[1100px] overflow-auto overscroll-contain rounded-[22px] border border-white/15 bg-[#101e38] p-0 text-white shadow-2xl backdrop:bg-slate-950/75 sm:w-[calc(100%-2rem)]">
      <div>
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/15 px-4 py-2 sm:px-5">
          <h2 id={titleId} className="font-serif text-xl leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl">{roomName}</h2>
          <button type="button" onClick={onClose} className={arrow} aria-label={isID ? 'Tutup galeri' : 'Close gallery'}><X className="size-5" aria-hidden /></button>
        </header>
        <div className="flex h-[min(75vw,50dvh)] min-h-36 items-center justify-center bg-[#0a1428] sm:h-[min(60dvh,620px)]">
          <GalleryPhoto key={gallery[index]} source={gallery[index]}
            alt={illustrated ? (isID ? 'Ilustrasi kamar' : 'Room illustration') : `${roomName} · ${index + 1}`}
            className="object-contain" />
        </div>
        <footer className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:px-5">
          {gallery.length > 1 ? <button type="button" onClick={prev} className={arrow} aria-label={isID ? 'Foto sebelumnya' : 'Previous photo'}><ChevronLeft className="size-5" aria-hidden /></button> : <span />}
          <span aria-live="polite" className="text-sm font-semibold text-white/85">{illustrated ? (isID ? 'Foto ilustrasi' : 'Illustrative photo') : `${index + 1} / ${gallery.length}`}</span>
          {gallery.length > 1 ? <button type="button" onClick={next} className={arrow} aria-label={isID ? 'Foto berikutnya' : 'Next photo'}><ChevronRight className="size-5" aria-hidden /></button> : <span />}
        </footer>
      </div>
    </dialog>
  );
}

export function RoomGallery({ gallery, roomName, isID, loading, illustrated }: RoomGalleryProps) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const index = Math.max(0, gallery.indexOf(activeUrl ?? ''));
  const multiple = gallery.length > 1;
  const current = gallery[index];
  const nextIndex = multiple ? (index + 1) % gallery.length : 0;
  const select = (value: number) => setActiveUrl(gallery[value]);
  const prev = () => select((index - 1 + gallery.length) % gallery.length);
  const next = () => select(nextIndex);

  const onGalleryKey = (event: KeyboardEvent) => {
    if (!multiple || expanded || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') prev();
    else next();
  };

  return (
    <section aria-label={isID ? 'Galeri foto kamar' : 'Room photo gallery'} data-room-gallery onKeyDown={onGalleryKey}>
      <div className={`relative grid aspect-[4/3] min-w-0 overflow-hidden rounded-[22px] bg-navy-soft sm:aspect-[16/9] sm:rounded-[24px] lg:aspect-[2/1] ${multiple ? 'md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] md:gap-1.5 md:bg-white' : ''}`}>
        {current ? (
          <>
            <div className="relative min-w-0 overflow-hidden bg-navy-soft">
              <button type="button" onClick={() => setExpanded(true)} className="absolute inset-0 size-full cursor-zoom-in focus-visible:-outline-offset-4"
                aria-label={isID ? 'Perbesar foto kamar' : 'Enlarge room photo'}>
                <GalleryPhoto key={current} source={current} alt={illustrated ? '' : roomName} className="object-cover" priority />
              </button>
              <span className={caption + ' pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4'} aria-live="polite">
                {illustrated ? (isID ? 'Foto ilustrasi' : 'Illustrative photo') : `${index + 1} / ${gallery.length}`}
              </span>
              {multiple && <div className="absolute bottom-3 left-3 flex gap-1.5 sm:bottom-4 sm:left-4">
                <button type="button" onClick={prev} className={arrow} aria-label={isID ? 'Foto sebelumnya' : 'Previous photo'}><ChevronLeft className="size-5" aria-hidden /></button>
                <button type="button" onClick={next} className={arrow} aria-label={isID ? 'Foto berikutnya' : 'Next photo'}><ChevronRight className="size-5" aria-hidden /></button>
              </div>}
            </div>
            {multiple && <button type="button" onClick={() => { next(); setExpanded(true); }}
              className="relative hidden min-w-0 cursor-zoom-in overflow-hidden bg-navy-soft focus-visible:-outline-offset-4 md:block"
              aria-label={isID ? 'Buka foto berikutnya di galeri' : 'Open next photo in gallery'}>
              <GalleryPhoto key={gallery[nextIndex]} source={gallery[nextIndex]} alt="" className="absolute inset-0 object-cover" />
            </button>}
            <button type="button" onClick={() => setExpanded(true)}
              className="absolute right-3 bottom-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/90 bg-white px-3 text-xs font-bold text-[#162951] shadow-md hover:bg-navy-soft sm:right-4 sm:bottom-4 sm:text-sm">
              <Images className="size-4" aria-hidden />{multiple ? (isID ? 'Lihat semua foto' : 'View all photos') : (isID ? 'Lihat foto' : 'View photo')}
            </button>
          </>
        ) : loading ? (
          <div className="absolute inset-0 bg-slate-200 motion-safe:animate-pulse" role="status" aria-busy="true">
            <span className="sr-only">{isID ? 'Memuat foto kamar…' : 'Loading room photos…'}</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-navy-dark">
            <CameraOff className="size-6" aria-hidden />{isID ? 'Foto kamar belum tersedia' : 'Room photos are unavailable'}
          </div>
        )}
      </div>
      {expanded && current && <RoomPhotoDialog gallery={gallery} index={index} roomName={roomName} isID={isID} illustrated={illustrated}
        onChange={select} onClose={() => setExpanded(false)} />}
    </section>
  );
}
