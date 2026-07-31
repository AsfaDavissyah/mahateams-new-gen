"use client";

import type { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, Delete, Lock, ShieldCheck, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loginAndAttendWithQrAction, verifyQrUserAction } from "./actions";

type CurrentUserProp = {
  name: string;
  role: string;
  studioName: string;
  statusText: string;
  statusColor: string;
};

type ScannedUser = {
  id: string;
  name: string;
  role: string;
  studioName: string;
  isPinSet: boolean;
};

export function QrLoginScanner({
  autoStart = false,
  currentUser,
  action,
  disabled = false,
  disabledMessage = "Scan action not available.",
}: {
  autoStart?: boolean;
  currentUser?: CurrentUserProp;
  action?: string;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const scannerId = `login-qr-scanner-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  // PIN Modal States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [scannedQrUid, setScannedQrUid] = useState<string | null>(null);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  const defaultMsg = disabled
    ? disabledMessage
    : currentUser
      ? "Arahkan QR Card ke kamera untuk presensi WFO."
      : "Arahkan QR Card ke kamera untuk masuk & presensi otomatis.";

  const [message, setMessage] = useState(defaultMsg);
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | null>(null);

  async function getCurrentPosition() {
    if (!navigator.geolocation) {
      throw new Error("Akses lokasi tidak didukung di browser ini.");
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  }

  const handlePinSubmit = useCallback(
    async (pinToSubmit: string) => {
      if (!scannedQrUid || pinToSubmit.length !== 6 || isSubmittingPin) return;

      setIsSubmittingPin(true);
      setPinError(null);

      try {
        const position = await getCurrentPosition();

        const res = (await loginAndAttendWithQrAction(scannedQrUid, pinToSubmit, {
          action,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })) as {
          success: boolean;
          error?: string;
          warning?: string;
          info?: string;
          message?: string;
          redirectUrl?: string;
        };

        if (res.success) {
          setIsPinModalOpen(false);
          if (res.warning) {
            setMessage(res.warning);
            setStatusType("error");
          } else if (res.info) {
            setMessage(res.info);
            setStatusType("info");
          } else if (res.message) {
            setMessage(res.message);
            setStatusType("success");
          } else {
            setMessage("Berhasil. Mengalihkan...");
            setStatusType("success");
          }

          const delay = res.warning || res.info || res.message ? 3500 : 800;
          setTimeout(() => {
            window.location.href = res.redirectUrl || "/";
          }, delay);
        } else {
          setPinError(res.error || "PIN tidak valid.");
          setPin("");
          setIsSubmittingPin(false);
        }
      } catch (error: unknown) {
        setPinError(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan sistem saat memproses presensi."
        );
        setPin("");
        setIsSubmittingPin(false);
      }
    },
    [scannedQrUid, action, isSubmittingPin]
  );

  function handleNumpadPress(val: string) {
    if (isSubmittingPin) return;
    setPinError(null);

    if (val === "clear") {
      setPin("");
      return;
    }

    if (val === "backspace") {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length < 6 && /^\d$/.test(val)) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 6) {
        void handlePinSubmit(nextPin);
      }
    }
  }

  // Physical keyboard listener when PIN modal is open
  useEffect(() => {
    if (!isPinModalOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumpadPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleNumpadPress("backspace");
      } else if (e.key === "Escape") {
        e.preventDefault();
        closePinModal();
      } else if (e.key === "Enter" && pin.length === 6) {
        e.preventDefault();
        void handlePinSubmit(pin);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinModalOpen, pin, handlePinSubmit]);

  function closePinModal() {
    setIsPinModalOpen(false);
    setScannedQrUid(null);
    setScannedUser(null);
    setPin("");
    setPinError(null);
    setIsSubmittingPin(false);
    setLoading(false);
    if (autoStart && !disabled) {
      void startScanner();
    }
  }

  async function startScanner() {
    if (disabled) {
      setMessage(disabledMessage);
      setStatusType("info");
      return;
    }

    if (loading) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Kamera tidak didukung di browser ini.");
      setStatusType("error");
      return;
    }

    setMessage("Membuka kamera...");
    setStatusType("info");

    try {
      await stopScanner();

      const { Html5Qrcode: Html5QrcodeReader } = await import("html5-qrcode");
      const scanner = new Html5QrcodeReader(scannerId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.777778,
        },
        async (decodedText) => {
          const qrUid = decodedText.trim();
          if (!qrUid) return;

          setLoading(true);
          setMessage("QR terdeteksi. Memverifikasi anggota...");
          setStatusType("info");
          await stopScanner();

          try {
            const userRes = await verifyQrUserAction(qrUid);

            if (userRes.success && userRes.user) {
              setScannedQrUid(qrUid);
              setScannedUser(userRes.user);
              setPin("");
              setPinError(null);
              setIsPinModalOpen(true);
              setLoading(false);
            } else {
              setMessage(userRes.error || "Kartu QR tidak terdaftar.");
              setStatusType("error");
              setLoading(false);
            }
          } catch (error: unknown) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Gagal memverifikasi kartu QR."
            );
            setStatusType("error");
            setLoading(false);
          }
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);
      setMessage("Arahkan QR Card ke depan kamera.");
      setStatusType("info");
    } catch {
      await stopScanner();
      setMessage("Gagal mengaktifkan kamera. Pastikan izin kamera telah diberikan.");
      setStatusType("error");
    }
  }

  useEffect(() => {
    if (autoStart && !disabled && !isPinModalOpen) {
      const timer = setTimeout(() => {
        void startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        void stopScanner();
      };
    }
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, disabled, isPinModalOpen]);

  return (
    <div className="grid gap-3">
      {currentUser && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 p-4 text-sm shadow-sm flex flex-col gap-3">
          <div>
            <p className="font-bold text-zinc-950 dark:text-zinc-50 text-base">{currentUser.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {currentUser.role === "ADMIN" ? "Admin" : "Member"} • {currentUser.studioName}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800/80">
            <span className="text-xs text-zinc-500 dark:text-zinc-450 font-semibold">Status Hari Ini:</span>
            <span className={`text-sm font-bold px-3 py-2.5 rounded-lg border text-center shadow-sm ${currentUser.statusColor}`}>
              {currentUser.statusText}
            </span>
          </div>
        </div>
      )}

      <div className="relative min-h-64 overflow-hidden rounded-md border border-zinc-200 bg-zinc-950">
        <div
          id={scannerId}
          className="min-h-64 text-sm text-zinc-100 [&_button]:rounded-md [&_button]:border [&_button]:border-zinc-300 [&_button]:bg-white [&_button]:px-3 [&_button]:py-2 [&_button]:text-zinc-900 [&_img]:mx-auto [&_video]:w-full"
        />
        {!isScanning && !loading && !isPinModalOpen ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            Kamera tidak aktif
          </div>
        ) : null}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm text-zinc-100">
            Memproses...
          </div>
        ) : null}
      </div>

      {!autoStart && !isPinModalOpen ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void startScanner()}
            disabled={disabled || isScanning || loading}
            className="w-full"
          >
            <Camera aria-hidden="true" className="mr-1.5 size-4" />
            Mulai Scan QR
          </Button>
        </div>
      ) : null}

      <div
        className={`rounded-md p-3 text-sm border ${
          statusType === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
            : statusType === "error"
              ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
              : statusType === "info"
                ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
        }`}
      >
        {message}
      </div>

      {/* ─── Modal Verifikasi PIN Security ──────────────────────────────── */}
      <Dialog open={isPinModalOpen} onOpenChange={(open) => !open && closePinModal()}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 mb-2">
              <ShieldCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Verifikasi PIN Keamanan
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              Masukkan 6-digit PIN Keamanan untuk mengonfirmasi kehadiran Anda.
            </DialogDescription>
          </DialogHeader>

          {scannedUser && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 flex items-center gap-3">
              <div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-zinc-950 dark:text-zinc-50 truncate">
                  {scannedUser.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {scannedUser.role === "ADMIN" ? "Admin" : "Member"} • {scannedUser.studioName}
                </p>
              </div>
            </div>
          )}

          {!scannedUser?.isPinSet && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Lock className="size-4 shrink-0 mt-0.5" />
              <span>
                PIN default Anda adalah <strong className="font-bold">000000</strong>. Anda dapat mengubahnya sewaktu-waktu di menu Settings.
              </span>
            </div>
          )}

          {pinError && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 font-semibold text-center animate-shake">
              {pinError}
            </div>
          )}

          {/* Display 6 Digits */}
          <div className="flex justify-center gap-2 my-2">
            {Array.from({ length: 6 }).map((_, idx) => {
              const hasVal = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`size-11 rounded-xl border-2 flex items-center justify-center text-xl font-extrabold transition-all ${
                    hasVal
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm scale-[1.03]"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {hasVal ? "•" : ""}
                </div>
              );
            })}
          </div>

          {/* Virtual Numpad Grid */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                onClick={() => handleNumpadPress(num)}
                disabled={isSubmittingPin}
                className="h-12 text-lg font-bold rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-transform"
              >
                {num}
              </Button>
            ))}

            <Button
              type="button"
              variant="ghost"
              onClick={() => handleNumpadPress("clear")}
              disabled={isSubmittingPin || pin.length === 0}
              className="h-12 text-xs font-semibold rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Clear
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleNumpadPress("0")}
              disabled={isSubmittingPin}
              className="h-12 text-lg font-bold rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-transform"
            >
              0
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => handleNumpadPress("backspace")}
              disabled={isSubmittingPin || pin.length === 0}
              className="h-12 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Delete className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={closePinModal}
              disabled={isSubmittingPin}
              className="w-full text-zinc-500"
            >
              <X className="mr-1.5 size-4" />
              Batal
            </Button>

            <Button
              type="button"
              onClick={() => void handlePinSubmit(pin)}
              disabled={isSubmittingPin || pin.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmittingPin ? "Memproses..." : "Konfirmasi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
