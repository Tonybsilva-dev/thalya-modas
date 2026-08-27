"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Barcode, CheckCircle, CircleNotch, Keyboard, WarningCircle } from "@phosphor-icons/react";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@thalya-modas/ui";
import { BrowserCodeReader, BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type ScannerPhase = "error" | "found" | "scanning" | "starting";

export function BarcodeScannerDialog({
  onCode,
  onOpenChange,
  open,
}: {
  onCode: (code: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string>();
  const [phase, setPhase] = useState<ScannerPhase>("starting");
  const [showStartHelp, setShowStartHelp] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("automatic");
  const [retryKey, setRetryKey] = useState(0);
  const detectedRef = useRef(false);
  const onCodeRef = useRef(onCode);
  const onOpenChangeRef = useRef(onOpenChange);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onCodeRef.current = onCode;
    onOpenChangeRef.current = onOpenChange;
  }, [onCode, onOpenChange]);

  const submitCode = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (code.length < 4 || detectedRef.current) return;
    detectedRef.current = true;
    setPhase("found");
    if ("vibrate" in navigator) navigator.vibrate(60);
    window.setTimeout(() => {
      onCodeRef.current(code);
      onOpenChangeRef.current(false);
      setManualCode("");
    }, 180);
  }, []);

  useEffect(() => {
    if (!open) return;
    const videoElement = videoRef.current;
    let cancelled = false;
    let controls: IScannerControls | undefined;
    const startupHelpTimer = window.setTimeout(() => {
      if (!cancelled) setShowStartHelp(true);
    }, 4_000);

    const finishStarting = () => {
      window.clearTimeout(startupHelpTimer);
      setShowStartHelp(false);
    };

    const stopScanner = () => {
      const activeControls = controls;
      controls = undefined;
      activeControls?.stop();
    };

    async function startScanner() {
      setCameraError(undefined);
      setPhase("starting");
      setShowStartHelp(false);
      detectedRef.current = false;

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        finishStarting();
        setPhase("error");
        setCameraError(
          "A câmera exige uma conexão segura. Abra o sistema por HTTPS ou em localhost e tente novamente.",
        );
        return;
      }

      try {
        if (cancelled || !videoElement) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 500,
          tryPlayVideoTimeout: 5_000,
        });

        controls = await reader.decodeFromVideoDevice(
          selectedDeviceId === "automatic" ? undefined : selectedDeviceId,
          videoElement,
          (result, _error, scannerControls) => {
            if (!result || detectedRef.current) return;
            scannerControls.stop();
            submitCode(result.getText());
          },
        );

        if (cancelled) {
          stopScanner();
          return;
        }

        finishStarting();
        setPhase("scanning");
        void BrowserCodeReader.listVideoInputDevices()
          .then((availableDevices) => {
            if (!cancelled) setDevices(availableDevices);
          })
          .catch(() => undefined);
      } catch (error) {
        if (cancelled) return;
        finishStarting();
        stopScanner();
        setPhase("error");
        setCameraError(getCameraErrorMessage(error));
      }
    }

    const startFrame = window.requestAnimationFrame(() => {
      void startScanner();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startFrame);
      window.clearTimeout(startupHelpTimer);
      stopScanner();
    };
  }, [open, retryKey, selectedDeviceId, submitCode]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode aria-hidden="true" className="size-5 text-primary" />
            Ler código de barras
          </DialogTitle>
          <DialogDescription>
            Centralize a etiqueta, aproxime-a da câmera e mantenha a imagem firme até a confirmação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {devices.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="scanner-camera">Câmera</Label>
              <Select onValueChange={setSelectedDeviceId} value={selectedDeviceId}>
                <SelectTrigger id="scanner-camera">
                  <SelectValue placeholder="Selecionar câmera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Seleção automática</SelectItem>
                  {devices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Câmera ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative aspect-video overflow-hidden border border-border bg-black">
            <video
              aria-label="Visualização da câmera para leitura do código de barras"
              className="size-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />

            {phase === "starting" && (
              <div className="absolute inset-0 grid place-items-center bg-black/45 p-6 text-center text-sm text-white">
                <span className="grid justify-items-center gap-2">
                  <CircleNotch aria-hidden="true" className="size-8 animate-spin motion-reduce:animate-none" />
                  Ativando a câmera…
                  {showStartHelp && (
                    <small className="max-w-sm text-xs leading-relaxed text-white/80">
                      Verifique se há uma solicitação de permissão aberta no navegador ou se outro
                      aplicativo está usando a câmera.
                    </small>
                  )}
                </span>
              </div>
            )}

            {phase === "scanning" && (
              <>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-[10%] top-[24%] h-[52%] border-2 border-primary shadow-[0_0_0_999px_rgb(0_0_0/0.25)]" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/65 p-2.5 text-xs font-medium text-white" role="status">
                  <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-primary" />
                  Procurando código…
                </div>
              </>
            )}

            {phase === "found" && (
              <div className="absolute inset-0 grid place-items-center bg-success/90 p-6 text-center font-semibold text-success-foreground" role="status">
                <span className="grid justify-items-center gap-2">
                  <CheckCircle aria-hidden="true" className="size-9" />
                  Código identificado
                </span>
              </div>
            )}

            {phase === "error" && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 p-6 text-center text-sm text-white">
                <WarningCircle aria-hidden="true" className="mb-2 size-8 justify-self-center" />
                Câmera indisponível
              </div>
            )}
          </div>

          {cameraError && (
            <Alert role="alert" variant="warning">
              <WarningCircle aria-hidden="true" />
              <div>
                <AlertDescription>{cameraError}</AlertDescription>
                <Button
                  className="mt-3 h-8 px-3"
                  onClick={() => setRetryKey((current) => current + 1)}
                  type="button"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            </Alert>
          )}

          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitCode(manualCode);
            }}
          >
            <Label htmlFor="scanner-manual-code">Código manual ou leitor USB</Label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Keyboard aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoComplete="off"
                  className="h-11 pl-10"
                  id="scanner-manual-code"
                  inputMode="numeric"
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="Ex.: 7891234567890"
                  value={manualCode}
                />
              </div>
              <Button className="h-11" disabled={manualCode.trim().length < 4} type="submit">
                Usar código
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "O acesso à câmera foi bloqueado. Permita o uso da câmera nas configurações do navegador e tente novamente.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Nenhuma câmera foi encontrada neste dispositivo.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.";
    }
    if (error.name === "OverconstrainedError") {
      return "A câmera não oferece a resolução solicitada. Escolha outra câmera ou tente novamente.";
    }
  }

  return "Não foi possível iniciar a leitura. Tente outra câmera ou informe o código manualmente.";
}
