import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

/** Valida e substitui a fonte pelo resultado parseado (campos desconhecidos são descartados). */
export function validate(source: Source, schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // `req.query` é getter em Express 5; guardamos o valor parseado separadamente.
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    next();
  };
}
