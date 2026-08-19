import * as React from "react";
import { ExternalLink, FileText, ListFilter, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getThreadsForReturn } from "@/mocks/collaboration";
import { getSourceDocument, sourceDocumentFile } from "@/mocks/documents";
import { threadsVisibleTo } from "./collaboration";
import { collectSourceDocuments, connectionsFor } from "./connections";
import { ConnectionLink } from "./connection-link";
import { AreaSection } from "./area-section";
import { useReturnView } from "@/hooks/use-return-view";
import { areasFor } from "./areas";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/utils";
import type { Return } from "./returns";
import type { RoleFamily } from "@/lib/roles";

type DocumentsSectionProps = {
  taxReturn: Return;
  viewerFamily: RoleFamily;
};

/**
 * The Documents Area (challenge 04): a proper uploaded-files library, not the
 * return map. Each document is a file — a name, kind, size, page count, upload
 * date, and the CDN URL a real viewer would load — and selecting one opens its
 * detail: the file's metadata, a "View document" link to the CDN URL, and the
 * Fields and Threads connected to it (which stay URL-highlightable, as elsewhere).
 * No in-app document viewer is implemented; the file is represented the way a
 * CDN-backed upload would be.
 */
export function DocumentsSection({
  taxReturn,
  viewerFamily,
}: DocumentsSectionProps) {
  const { focus, setFocus } = useReturnView({
    areas: areasFor(viewerFamily).map((area) => area.id),
  });

  const documents = React.useMemo(() => {
    return [...collectSourceDocuments(taxReturn).entries()].map(
      ([documentId, collected]) => {
        const doc = getSourceDocument(documentId);
        const file = sourceDocumentFile(documentId);
        return {
          id: documentId,
          title: collected.title,
          kind: doc?.kind ?? "Document",
          fieldLabels: collected.fieldLabels,
          file,
        };
      },
    );
  }, [taxReturn]);

  const selectedId =
    focus !== null && focus.kind === "source-document"
      ? focus.id
      : (documents[0]?.id ?? null);
  const selected =
    documents.find((document) => document.id === selectedId) ?? documents[0];

  const threads = threadsVisibleTo(
    getThreadsForReturn(taxReturn.id),
    viewerFamily,
  );

  return (
    <AreaSection
      eyebrow="Uploaded files"
      icon={FileText}
      title="Documents"
      description="The files uploaded to this return. Select one to see its details and the Fields and Threads it feeds."
      action={
        <Button type="button" size="sm">
          <Upload aria-hidden="true" />
          Upload document
        </Button>
      }
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(16rem,1.1fr)]">
        {/* The file list — an uploads library, not a review hierarchy. */}
        <div className="flex min-w-0 flex-col border-b border-border lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">Uploaded files</p>
            <Badge variant="outline" className="tabular-nums">
              {documents.length}
            </Badge>
          </div>
          <ul className="max-h-96 overflow-y-auto border-t border-border">
            {documents.map((document) => {
              const isSelected = document.id === selected?.id;
              return (
                <li
                  key={document.id}
                  className="border-b border-border last:border-b-0"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() =>
                      setFocus({ kind: "source-document", id: document.id })
                    }
                    className={cn(
                      "h-auto w-full items-start justify-start gap-3 rounded-none px-4 py-3 text-left whitespace-normal sm:px-5",
                      isSelected && "bg-accent",
                    )}
                  >
                    <FileText
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {document.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {document.file
                          ? `${document.file.mimeType} · ${document.file.sizeLabel} · ${document.file.pageCount} page${document.file.pageCount === 1 ? "" : "s"} · ${formatShortDate(document.file.uploadedAt)}`
                          : `${document.kind} · ${document.fieldLabels.length} connected Field${document.fieldLabels.length === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {document.kind}
                    </Badge>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The selected file's detail — metadata + CDN link + connections. */}
        {selected ? (
          <DocumentsDetail
            document={selected}
            taxReturn={taxReturn}
            threads={threads}
            viewerFamily={viewerFamily}
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center px-5 py-8 text-sm text-muted-foreground">
            No documents on this return yet.
          </div>
        )}
      </div>
    </AreaSection>
  );
}

type DocumentEntry = {
  id: string;
  title: string;
  kind: string;
  fieldLabels: string[];
  file?: ReturnType<typeof sourceDocumentFile>;
};

function DocumentsDetail({
  document,
  taxReturn,
  threads,
  viewerFamily,
}: {
  document: DocumentEntry;
  taxReturn: Return;
  threads: ReturnType<typeof getThreadsForReturn>;
  viewerFamily: RoleFamily;
}) {
  const connections = connectionsFor(
    { kind: "source-document", id: document.id },
    taxReturn,
    threads,
    viewerFamily,
  );

  return (
    <aside
      aria-label="Selected document detail"
      className="flex min-w-0 flex-col gap-4 bg-background px-5 py-5 sm:px-6"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="outline" className="gap-1">
          <FileText aria-hidden="true" />
          {document.kind}
        </Badge>
        <Badge variant="secondary">Uploaded</Badge>
      </div>

      <div>
        <h3
          tabIndex={-1}
          data-return-focus={document.id}
          data-return-focus-kind="source-document"
          className="font-serif text-lg font-semibold tracking-tight outline-none"
        >
          {document.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {document.file?.fileName}
        </p>
      </div>

      {document.file && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <FileMeta label="Type" value={document.file.mimeType} />
          <FileMeta label="Size" value={document.file.sizeLabel} />
          <FileMeta label="Pages" value={String(document.file.pageCount)} />
          <FileMeta
            label="Uploaded"
            value={formatShortDate(document.file.uploadedAt)}
          />
        </dl>
      )}

      {/* No viewer here — this is the URL a CDN-backed integration would load. */}
      {document.file && (
        <Button asChild variant="outline" size="sm" className="w-fit">
          <a
            href={document.file.cdnUrl}
            target="_blank"
            rel="noreferrer"
            className="gap-1.5"
          >
            <ExternalLink aria-hidden="true" className="size-3.5" />
            View document
          </a>
        </Button>
      )}

      {document.fieldLabels.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Fields this document feeds
          </p>
          <ul className="flex flex-col gap-1">
            {document.fieldLabels.map((label) => (
              <li key={label} className="flex items-center gap-2 text-xs">
                <ListFilter
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-primary"
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {connections.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Connected on this Return
          </p>
          <ul className="flex flex-col gap-1 text-xs">
            {connections.map((connection) => (
              <li key={connection.id}>
                <ConnectionLink connection={connection} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function FileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
