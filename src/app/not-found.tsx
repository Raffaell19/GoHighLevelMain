import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Página não encontrada</h2>
      <p className="text-slate-400 mb-4">A página que você está procurando não existe.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
