import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Alert, Button, TextInput } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setFields({});
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Cadastre sua empresa"
      subtitle="Você será o administrador inicial do seu workspace"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextInput label="Nome da empresa" required value={form.companyName} onChange={set("companyName")} error={fields.companyName} />
        <TextInput label="Seu nome" autoComplete="name" required value={form.name} onChange={set("name")} error={fields.name} />
        <TextInput label="E-mail" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fields.email} />
        <TextInput label="Senha" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set("password")} error={fields.password} />
        <p className="-mt-2 text-xs text-slate-500">Mínimo de 8 caracteres.</p>
        <Button type="submit" loading={loading} className="w-full">
          Criar empresa e conta
        </Button>
      </form>
    </AuthLayout>
  );
}
