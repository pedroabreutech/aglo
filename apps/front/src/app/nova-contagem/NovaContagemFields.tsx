"use client";

import Image from "next/image";
import type { Dispatch, RefObject, SetStateAction } from "react";
import MainTitle from "@/src/components/mainTitle/mainTitle";
import DataSvg from "./image/data.svg";
import UploadSvg from "./image/upload.svg";
import WarningSvg from "./image/warning.svg";
import LocalizacaoSvg from "./image/local.svg";

type NovaContagemFieldsProps = {
  isEditMode: boolean;
  eventName: string;
  setEventName: Dispatch<SetStateAction<string>>;
  eventDate: string;
  onEventDateChange: (value: string) => void;
  eventType: string;
  setEventType: Dispatch<SetStateAction<string>>;
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
  imageFile: File | null;
  setImageFile: Dispatch<SetStateAction<File | null>>;
  existingImagePath: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export function NovaContagemFields({
  isEditMode,
  eventName,
  setEventName,
  eventDate,
  onEventDateChange,
  eventType,
  setEventType,
  address,
  setAddress,
  imageFile,
  setImageFile,
  existingImagePath,
  fileInputRef,
}: NovaContagemFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-[6px]">
        <MainTitle
          text={
            isEditMode
              ? "Editar cadastro do evento"
              : "Criar nova contagem do evento"
          }
        />
        <p className="text-[#64748B] font-light mb-4">
          {isEditMode
            ? "Atualize os dados cadastrais do evento sem alterar a imagem processada."
            : "Configure os parâmetros para a criação de estimativa do tamanho da multidão"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="py-[40px] px-[25px] flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-start border-b border-gray-100 pb-8">
            <div>
              <h3 className="text-[#334155] font-semibold text-sm mb-1">
                Nome do evento
              </h3>
              <p className="text-[#64748B] text-xs/4 font-light">
                Forneça um título descritivo para esta análise.
              </p>
            </div>

            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              type="text"
              placeholder="Exemplo: Marcha pela liberdade - Janeiro/2026"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#137FEC]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-start border-b border-gray-100 pb-8">
            <div>
              <h3 className="text-[#334155] font-semibold text-sm mb-1">
                Local e data do evento
              </h3>
              <p className="text-[#64748B] text-xs/4 font-light">
                Onde e quando a análise está sendo realizada?
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs text-[#64748B] mb-2 block font-normal">
                  Localização
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Image
                      src={LocalizacaoSvg}
                      alt="Localização"
                      width={18}
                      height={18}
                      style={{ height: "auto" }}
                    />
                  </span>

                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    type="text"
                    placeholder="Exemplo: Esplanada dos Ministérios, Brasília - DF"
                    className="w-full border border-gray-200 rounded-lg p-3 pl-11 text-sm focus:outline-none focus:ring-1 focus:ring-[#137FEC]"
                  />
                </div>
              </div>

              <div className="w-full md:w-[50%]">
                <label className="text-xs text-[#64748B] mb-2 block font-normal">
                  Data do evento
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Image
                      src={DataSvg}
                      alt="Data"
                      width={18}
                      height={18}
                      style={{ height: "auto" }}
                    />
                  </span>

                  <input
                    value={eventDate}
                    onChange={(e) => onEventDateChange(e.target.value)}
                    type="text"
                    placeholder="dd / mm / aaaa"
                    className="w-full border border-gray-200 rounded-lg p-3 pl-11 text-sm focus:outline-none focus:ring-1 focus:ring-[#137FEC]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-start border-b border-gray-100 pb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-[#334155] font-semibold text-sm">
                Tipo de evento
              </h3>

              <Image
                src={WarningSvg}
                alt="Aviso"
                width={24}
                height={24}
                style={{ height: "auto" }}
              />
            </div>

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#137FEC]"
            >
              <option value="">Selecione uma opção</option>
              <option value="Manifestação Política">
                Manifestação Política
              </option>
              <option value="Evento Esportivo">Evento Esportivo</option>
              <option value="Show / Concerto">Show / Concerto</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-start">
            <div className="pr-[30px]">
              <h3 className="text-[#334155] font-semibold text-sm mb-1">
                Upload da imagem
              </h3>
              <p className="text-[#64748B] text-xs/4 font-light">
                {isEditMode
                  ? "A imagem já cadastrada é mantida. Troca de imagem não está disponível nesta edição."
                  : "Faça o upload de imagens de alta resolução para melhores resultados na contagem automática."}
              </p>
            </div>

            {isEditMode ? (
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-8">
                <p className="text-sm font-medium text-slate-700">
                  Imagem atual preservada
                </p>
                {existingImagePath && (
                  <a
                    href={existingImagePath}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-[#137FEC] hover:underline"
                  >
                    Abrir imagem original
                  </a>
                )}
              </div>
            ) : (
              <div className="flex w-full flex-col gap-4">
                <div className="w-full border-2 border-dashed border-[#A8CDF4] rounded-xl bg-[#E6EFF8] py-14 px-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Image
                      src={UploadSvg}
                      alt="Upload"
                      width={22}
                      height={22}
                      style={{ height: "auto" }}
                    />
                  </div>

                  <p className="text-lg font-semibold text-slate-700">
                    {imageFile
                      ? imageFile.name
                      : "Arraste e solte suas imagens aqui."}
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#137FEC] text-white py-2 px-10 rounded-lg"
                  >
                    Carregar arquivos
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <Image
                      src={WarningSvg}
                      alt=""
                      width={16}
                      height={16}
                      className="mt-0.5 shrink-0"
                      style={{ height: "auto" }}
                    />
                    <div>
                      <p className="font-semibold">
                        Requisitos para contagem automática (P2Pnet)
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-900/90">
                        <li>Imagem de boa qualidade e alta resolução.</li>
                        <li>Ângulo de aproximadamente 90° (vista vertical / top-down).</li>
                        <li>
                          Evite obstruções como árvores, prédios, casas e sombras que
                          possam ocultar pessoas na imagem.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
