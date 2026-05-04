import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl justify-center">
        <RegisterForm />
      </div>
    </main>
  );
}
