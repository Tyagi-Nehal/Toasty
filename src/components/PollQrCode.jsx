import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function PollQrCode({ token }) {
  const [image, setImage] = useState('')
  const [error, setError] = useState('')
  const url = `${window.location.origin}/vote/${token}`
  useEffect(() => {
    let stopped = false
    setImage(''); setError('')
    QRCode.toDataURL(url, { width: 320, margin: 4, errorCorrectionLevel: 'M' })
      .then((result) => { if (!stopped) setImage(result) })
      .catch(() => { if (!stopped) setError('Could not generate the QR image. Use the poll link below.') })
    return () => { stopped = true }
  }, [url])
  return <section className="mt-5 rounded-3xl border border-accent/30 bg-white p-5">
    <h2 className="font-bold">Scan to vote</h2>
    <p className="mt-1 text-sm text-ink/60">Members and guests can enter their name and email, then vote. No sign-in required.</p>
    {image && <img src={image} width={256} height={256} alt="QR code for this meeting’s voting poll" />}
    {error && <p role="alert">{error}</p>}
    <a href={url} target="_blank" rel="noreferrer" className="block break-all text-sm text-primary underline">Open this poll</a>
    {image && <a href={image} download="toasty-poll-qr.png" className="mt-3 inline-block rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary">Download QR code</a>}
  </section>
}
