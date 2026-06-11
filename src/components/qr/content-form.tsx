"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  type Icon,
  LinkSimpleIcon,
  PhoneIcon,
  TextAaIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  QR_TYPE_LABELS,
  type QrFields,
  type QrType,
  type ValidationResult,
  type WifiEncryption,
} from "@/lib/qr";

const QR_TYPES: QrType[] = ["url", "text", "email", "phone", "wifi"];

const TYPE_ICONS: Record<QrType, Icon> = {
  url: LinkSimpleIcon,
  text: TextAaIcon,
  email: EnvelopeSimpleIcon,
  phone: PhoneIcon,
  wifi: WifiHighIcon,
};

const WIFI_ENCRYPTION_LABELS: Record<WifiEncryption, string> = {
  WPA: "WPA / WPA2",
  WEP: "WEP",
  nopass: "None (open)",
};

const qrFieldsSchema = z.object({
  url: z.object({ url: z.string() }),
  text: z.object({ text: z.string() }),
  email: z.object({
    to: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  phone: z.object({ phone: z.string() }),
  wifi: z.object({
    ssid: z.string(),
    password: z.string(),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean(),
  }),
});

interface ContentFormProps {
  type: QrType;
  fields: QrFields;
  validation: ValidationResult;
  onTypeChange: (type: QrType) => void;
  onFieldChange: <T extends QrType>(
    type: T,
    patch: Partial<QrFields[T]>,
  ) => void;
}

export function ContentForm({
  type,
  fields,
  validation,
  onTypeChange,
  onFieldChange,
}: ContentFormProps) {
  const form = useForm<z.infer<typeof qrFieldsSchema>>({
    resolver: zodResolver(qrFieldsSchema),
    values: fields,
  });

  const fieldError = (field: string) =>
    !validation.ok && validation.field === field
      ? { message: validation.message }
      : undefined;

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()}>
      <Tabs
        value={type}
        onValueChange={(v) => v && onTypeChange(v as QrType)}
        className="gap-3"
      >
        <TabsList className="flex h-auto w-full rounded-none bg-muted/60 p-1">
          {QR_TYPES.map((qrType) => {
            const TypeIcon = TYPE_ICONS[qrType];
            return (
              <TabsTrigger
                key={qrType}
                value={qrType}
                className="h-auto flex-col gap-0.5 rounded-none py-1.5 text-[10px] sm:flex-row sm:gap-1.5 sm:text-xs"
              >
                <TypeIcon />
                {QR_TYPE_LABELS[qrType]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="url" className="flex-none">
          <Controller
            name="url.url"
            control={form.control}
            render={({ field, fieldState }) => {
              const error = fieldState.error ?? fieldError("url");
              return (
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="qr-url">Link</FieldLabel>
                  <Input
                    {...field}
                    id="qr-url"
                    inputMode="url"
                    placeholder="example.com or https://..."
                    aria-invalid={!!error || undefined}
                    onChange={(event) => {
                      field.onChange(event);
                      onFieldChange("url", { url: event.target.value });
                    }}
                  />
                  <FieldError errors={[error]} />
                </Field>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="text" className="flex-none">
          <Controller
            name="text.text"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="qr-text">Text</FieldLabel>
                <Textarea
                  {...field}
                  id="qr-text"
                  placeholder="Anything you want to encode..."
                  className="max-h-28"
                  aria-invalid={fieldState.invalid || undefined}
                  onChange={(event) => {
                    field.onChange(event);
                    onFieldChange("text", { text: event.target.value });
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </TabsContent>

        <TabsContent value="email" className="flex-none">
          <FieldGroup className="gap-4">
            <Controller
              name="email.to"
              control={form.control}
              render={({ field, fieldState }) => {
                const error = fieldState.error ?? fieldError("to");
                return (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="qr-email-to">Email address</FieldLabel>
                    <Input
                      {...field}
                      id="qr-email-to"
                      type="email"
                      placeholder="hello@example.com"
                      aria-invalid={!!error || undefined}
                      onChange={(event) => {
                        field.onChange(event);
                        onFieldChange("email", { to: event.target.value });
                      }}
                    />
                    <FieldError errors={[error]} />
                  </Field>
                );
              }}
            />
            <Controller
              name="email.subject"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="qr-email-subject">
                    Subject (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="qr-email-subject"
                    placeholder="Hello!"
                    aria-invalid={fieldState.invalid || undefined}
                    onChange={(event) => {
                      field.onChange(event);
                      onFieldChange("email", {
                        subject: event.target.value,
                      });
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="email.body"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="qr-email-body">
                    Message (optional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="qr-email-body"
                    placeholder="Your message..."
                    className="max-h-20"
                    aria-invalid={fieldState.invalid || undefined}
                    onChange={(event) => {
                      field.onChange(event);
                      onFieldChange("email", { body: event.target.value });
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="phone" className="flex-none">
          <Controller
            name="phone.phone"
            control={form.control}
            render={({ field, fieldState }) => {
              const error = fieldState.error ?? fieldError("phone");
              return (
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="qr-phone">Phone number</FieldLabel>
                  <Input
                    {...field}
                    id="qr-phone"
                    type="tel"
                    placeholder="+60 12 345 6789"
                    aria-invalid={!!error || undefined}
                    onChange={(event) => {
                      field.onChange(event);
                      onFieldChange("phone", { phone: event.target.value });
                    }}
                  />
                  <FieldError errors={[error]} />
                </Field>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="wifi" className="flex-none">
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="wifi.ssid"
                control={form.control}
                render={({ field, fieldState }) => {
                  const error = fieldState.error ?? fieldError("ssid");
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor="qr-wifi-ssid">
                        Network name (SSID)
                      </FieldLabel>
                      <Input
                        {...field}
                        id="qr-wifi-ssid"
                        placeholder="My Network"
                        aria-invalid={!!error || undefined}
                        onChange={(event) => {
                          field.onChange(event);
                          onFieldChange("wifi", {
                            ssid: event.target.value,
                          });
                        }}
                      />
                      <FieldError errors={[error]} />
                    </Field>
                  );
                }}
              />
              <Controller
                name="wifi.password"
                control={form.control}
                render={({ field, fieldState }) => {
                  const error = fieldState.error ?? fieldError("password");
                  return (
                    <Field
                      data-disabled={fields.wifi.encryption === "nopass"}
                      data-invalid={!!error}
                    >
                      <FieldLabel htmlFor="qr-wifi-password">
                        Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="qr-wifi-password"
                        placeholder={
                          fields.wifi.encryption === "nopass"
                            ? "Not needed for open networks"
                            : "Network password"
                        }
                        disabled={fields.wifi.encryption === "nopass"}
                        aria-invalid={!!error || undefined}
                        onChange={(event) => {
                          field.onChange(event);
                          onFieldChange("wifi", {
                            password: event.target.value,
                          });
                        }}
                      />
                      <FieldError errors={[error]} />
                    </Field>
                  );
                }}
              />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Controller
                name="wifi.encryption"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className="min-w-40" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="qr-wifi-encryption">
                      Security
                    </FieldLabel>
                    <Select
                      items={WIFI_ENCRYPTION_LABELS}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        onFieldChange("wifi", {
                          encryption: value as WifiEncryption,
                        });
                      }}
                    >
                      <SelectTrigger
                        id="qr-wifi-encryption"
                        className="w-full"
                        aria-invalid={fieldState.invalid || undefined}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WIFI_ENCRYPTION_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="wifi.hidden"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="h-8 items-center">
                    <Switch
                      id="qr-wifi-hidden"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        onFieldChange("wifi", { hidden: checked });
                      }}
                    />
                    <FieldLabel htmlFor="qr-wifi-hidden">
                      Hidden network
                    </FieldLabel>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </TabsContent>
      </Tabs>
    </form>
  );
}
