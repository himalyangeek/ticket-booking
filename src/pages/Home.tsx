import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-10">
      <h1 className="text-2xl font-semibold">Ticket Booking</h1>
      <Link to="/book" className="rounded border px-4 py-2 text-center hover:bg-gray-50">
        Book a ticket
      </Link>
      <Link to="/tickets" className="rounded border px-4 py-2 text-center hover:bg-gray-50">
        My tickets
      </Link>
      <Link to="/scan" className="rounded border px-4 py-2 text-center hover:bg-gray-50">
        Scan tickets
      </Link>
    </div>
  )
}
