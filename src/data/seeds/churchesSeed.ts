import type { Church } from "../types/entities";

/**
 * Seed churches matching the canonical Christ Embassy Mozambique directory.
 * Used to initialise mock / local data-layer stores when empty.
 */
function st(
  churchId: string,
  slot: number,
  day_of_week: string,
  service_name: string,
  time: string,
  service_type = "Presencial",
) {
  return {
    id: `st-${churchId}-${slot}`,
    day_of_week,
    service_name,
    time,
    service_type,
    is_active: true,
    notes: "",
  };
}

function church(
  partial: Omit<Church, "service_times" | "isActive"> & {
    type: string;
    custom_service_times?: Church["service_times"];
  },
): Church {
  const serviceTimes =
    partial.custom_service_times || [
      st(partial.id, 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st(partial.id, 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ];

  return {
    ...partial,
    church_id: partial.church_id || partial.id,
    service_times: serviceTimes,
    isActive: (partial.status || "Activa") === "Activa",
  };
}

export const CHURCHES_SEED: Church[] = [
  // 1. Sede Nacional
  church({
    id: "a1111111-1111-4111-8111-111111111101",
    church_name: "E.C. Maputo Central - Sede",
    public_name: "E.C. Maputo Central - Sede",
    type: "Sede Nacional",
    province: "Maputo Cidade",
    city: "KaMpfumo",
    district_or_area: "Urbanização",
    address: "Avenida de Angola No 1818, Maputo",
    pastor_in_charge: "Pastor Kene Ume",
    phone_primary: "+258 86 227 0000",
    phone_secondary: "",
    email: "info@embaixadadecristo.org",
    facebook: "Embaixada de Cristo Moçambique",
    instagram: "@embaixada_de_cristo_mocambique",
    youtube: "",
    parent_church_id: "",
    status: "Activa",
    information_status: "Confirmado",
    notes: "Sede Nacional",
    created_by: "Admin Principal",
    updated_by: "Admin Principal",
    created_at: "2024-01-01",
    updated_at: "2026-10-12",
    attendance_last_4_weeks: [112, 98, 104, 92],
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111101", 0, "Domingo", "1º Culto", "07:45 - 09:15"),
      st("a1111111-1111-4111-8111-111111111101", 1, "Domingo", "2º Culto", "09:30 - 11:15"),
      st("a1111111-1111-4111-8111-111111111102", 2, "Quarta-feira", "Culto de Ensino", "18:00 - 20:00"),
    ],
  }),

  // 2. E.C. Maxaquene
  church({
    id: "a4b58c3d-5f45-4dfd-9fc3-eef0b28f4394",
    church_name: "E.C. Maxaquene",
    public_name: "E.C. Maxaquene",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "KaMaxakeni",
    district_or_area: "Maxaquene",
    address: "Av. Milagre Mabote, Perto do Comando distrital da Policia Municipal",
    pastor_in_charge: "",
    phone_primary: "+258 85 071 5705",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a4b58c3d-5f45-4dfd-9fc3-eef0b28f4394", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("a4b58c3d-5f45-4dfd-9fc3-eef0b28f4394", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 3. E.C. Soveste
  church({
    id: "134ca1e9-1923-4751-a389-2e1f6fd08308",
    church_name: "E.C. Soveste",
    public_name: "E.C. Soveste",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "KaMaxakeni",
    district_or_area: "Maxaquene",
    address: "Rua da Soveste, Em frente ao Car Wash",
    pastor_in_charge: "",
    phone_primary: "+258 87 907 6716",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("134ca1e9-1923-4751-a389-2e1f6fd08308", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("134ca1e9-1923-4751-a389-2e1f6fd08308", 1, "Domingo", "Culto de Domingo", "08:00 - 10:00"),
    ],
  }),

  // 4. E.C. Malhazine
  church({
    id: "5bec53aa-8d64-49d9-a065-9670e408fcca",
    church_name: "E.C. Malhazine",
    public_name: "E.C. Malhazine",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "KaMavota",
    district_or_area: "Magoanine A",
    address: "Bairro de Magoanine \"A\", Próximo à paragem Muswazi",
    pastor_in_charge: "",
    phone_primary: "+258 86 570 5588",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("5bec53aa-8d64-49d9-a065-9670e408fcca", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("5bec53aa-8d64-49d9-a065-9670e408fcca", 1, "Domingo", "Culto de Domingo", "08:00 - 10:00"),
    ],
  }),

  // 5. E.C. Matendene
  church({
    id: "a89e625e-e1d6-4b68-a20e-a3897f4ba61e",
    church_name: "E.C. Matendene",
    public_name: "E.C. Matendene",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "KaMavota",
    district_or_area: "Matendene",
    address: "Cruzamento de Matendene Primeira lomba, Rua do projeto",
    pastor_in_charge: "",
    phone_primary: "+258 84 017 3645",
    phone_secondary: "+258 87 317 3645",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a89e625e-e1d6-4b68-a20e-a3897f4ba61e", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("a89e625e-e1d6-4b68-a20e-a3897f4ba61e", 1, "Domingo", "Culto de Domingo", "08:00 - 10:00"),
    ],
  }),

  // 6. E.C. Choupal
  church({
    id: "a1111111-1111-4111-8111-111111111106",
    church_name: "E.C. Choupal",
    public_name: "E.C. Choupal",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "KaMubukwana",
    district_or_area: "Choupal",
    address: "Rua 9, Choupal",
    pastor_in_charge: "",
    phone_primary: "+258 84 698 5710",
    phone_secondary: "+258 84 717 0785",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111106", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("a1111111-1111-4111-8111-111111111106", 1, "Domingo", "Culto de Domingo", "08:00 - 11:00"),
    ],
  }),

  // 7. E.C. Matola (Machava Sede)
  church({
    id: "a1111111-1111-4111-8111-111111111102",
    church_name: "E.C. Matola",
    public_name: "E.C. Matola",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Matola",
    district_or_area: "Machava Sede",
    address: "Machava Sede, Paragem Nazi Nazi em frente ao Banco BIM",
    pastor_in_charge: "",
    phone_primary: "+258 84 780 9005",
    phone_secondary: "+258 87 780 9009",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111102", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("a1111111-1111-4111-8111-111111111102", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 8. E.C. Machava 1
  church({
    id: "ff953bf1-7964-4023-be6e-13b5dc7fd5e3",
    church_name: "E.C. Machava 1",
    public_name: "E.C. Machava 1",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Matola",
    district_or_area: "Machava 1",
    address: "Paragem Baião",
    pastor_in_charge: "",
    phone_primary: "+258 84 634 8924",
    phone_secondary: "+258 86 634 8924",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("ff953bf1-7964-4023-be6e-13b5dc7fd5e3", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("ff953bf1-7964-4023-be6e-13b5dc7fd5e3", 1, "Domingo", "Culto de Domingo", "08:30 - 10:00"),
    ],
  }),

  // 9. E.C. Matola 700
  church({
    id: "25933efb-20a3-43a4-a610-410360a1df94",
    church_name: "E.C. Matola 700",
    public_name: "E.C. Matola 700",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Matola",
    district_or_area: "Matola F",
    address: "Atrás do Shoprite, Rua de Sofala, número 178, Matola F, ao pé da MOBISCO",
    pastor_in_charge: "",
    phone_primary: "+258 87 737 9797",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("25933efb-20a3-43a4-a610-410360a1df94", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("25933efb-20a3-43a4-a610-410360a1df94", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 10. E.C. Khongolote
  church({
    id: "a1111111-1111-4111-8111-111111111103",
    church_name: "E.C. Khongolote",
    public_name: "E.C. Khongolote",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Matola",
    district_or_area: "Khongolote",
    address: "1 de Maio, atrás da nossa loja",
    pastor_in_charge: "",
    phone_primary: "+258 84 366 8999",
    phone_secondary: "+258 87 366 5744",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111103", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 19:20"),
      st("a1111111-1111-4111-8111-111111111103", 1, "Domingo", "Culto de Domingo", "09:00 - 10:30"),
    ],
  }),

  // 11. E.C. Chamanculo
  church({
    id: "e30f5af0-5011-4e9b-9257-95a3d5e375ea",
    church_name: "E.C. Chamanculo",
    public_name: "E.C. Chamanculo",
    type: "Igreja Local",
    province: "Maputo Cidade",
    city: "Nlhamankulu",
    district_or_area: "Chamanculo",
    address: "Rua da UFA",
    pastor_in_charge: "",
    phone_primary: "+258 84 752 8642",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("e30f5af0-5011-4e9b-9257-95a3d5e375ea", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("e30f5af0-5011-4e9b-9257-95a3d5e375ea", 1, "Domingo", "Culto de Domingo", "08:00 - 10:00"),
    ],
  }),

  // 12. E.C. Zona Verde
  church({
    id: "285a880a-2cca-4d13-8224-f831ccfeb141",
    church_name: "E.C. Zona Verde",
    public_name: "E.C. Zona Verde",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Matola",
    district_or_area: "Zona Verde",
    address: "Paragem Distrito",
    pastor_in_charge: "",
    phone_primary: "+258 84 640 8877",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("285a880a-2cca-4d13-8224-f831ccfeb141", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 19:30"),
      st("285a880a-2cca-4d13-8224-f831ccfeb141", 1, "Domingo", "Culto de Domingo", "08:30 - 10:00"),
    ],
  }),

  // 13. E.C. Manhiça
  church({
    id: "132f3e3d-02e2-4dfe-9e42-c46fa59f3883",
    church_name: "E.C. Manhiça",
    public_name: "E.C. Manhiça",
    type: "Igreja Local",
    province: "Maputo Província",
    city: "Manhiça",
    district_or_area: "Manhiça",
    address: "Estrada N1, ao lado do restaurante A Palhota (paragem mercado aeródromo)",
    pastor_in_charge: "",
    phone_primary: "+258 87 506 2895",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("132f3e3d-02e2-4dfe-9e42-c46fa59f3883", 0, "Quarta-feira", "Culto de Quarta-feira", "17:30 - 19:00"),
      st("132f3e3d-02e2-4dfe-9e42-c46fa59f3883", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 14. E.C. Inhambane
  church({
    id: "586f3073-f5aa-49a6-b09a-51d5747e9991",
    church_name: "E.C. Inhambane",
    public_name: "E.C. Inhambane",
    type: "Igreja Local",
    province: "Inhambane",
    city: "Inhambane",
    district_or_area: "Liberdade 1",
    address: "Bairro Liberdade 1, Marivas (antigo ginásio)",
    pastor_in_charge: "",
    phone_primary: "+258 85 625 8985",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("586f3073-f5aa-49a6-b09a-51d5747e9991", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 19:30"),
      st("586f3073-f5aa-49a6-b09a-51d5747e9991", 1, "Domingo", "Culto de Domingo", "08:30 - 10:00"),
    ],
  }),

  // 15. E.C. Beira
  church({
    id: "a1111111-1111-4111-8111-111111111104",
    church_name: "E.C. Beira",
    public_name: "E.C. Beira",
    type: "Igreja Local",
    province: "Sofala",
    city: "Beira",
    district_or_area: "Centro",
    address: "Cinema Olímpia (atrás da AGL), Beira",
    pastor_in_charge: "",
    phone_primary: "+258 87 402 0035",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111104", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 20:00"),
      st("a1111111-1111-4111-8111-111111111104", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 16. E.C. Tete
  church({
    id: "66803aaa-ba1d-461f-8ca3-a27311c04fa8",
    church_name: "E.C. Tete",
    public_name: "E.C. Tete",
    type: "Igreja Local",
    province: "Tete",
    city: "Tete",
    district_or_area: "Francisco Manyanga",
    address: "Perto do hospital centro número 3, Bairro Francisco Manyanga",
    pastor_in_charge: "",
    phone_primary: "+258 86 029 0962",
    phone_secondary: "+258 84 129 6839",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("66803aaa-ba1d-461f-8ca3-a27311c04fa8", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 19:30"),
      st("66803aaa-ba1d-461f-8ca3-a27311c04fa8", 1, "Domingo", "Culto de Domingo", "08:30 - 11:00"),
    ],
  }),

  // 17. E.C. Chimoio
  church({
    id: "01bd4fc6-7ac1-4f34-a370-89cc967727b1",
    church_name: "E.C. Chimoio",
    public_name: "E.C. Chimoio",
    type: "Igreja Local",
    province: "Manica",
    city: "Chimoio",
    district_or_area: "7 de Setembro",
    address: "Bairro 7 de Setembro, Rua do Pimpão, ao lado da Farmácia 7 de Setembro",
    pastor_in_charge: "",
    phone_primary: "+258 87 215 6741",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("01bd4fc6-7ac1-4f34-a370-89cc967727b1", 0, "Quarta-feira", "Culto de Quarta-feira", "18:00 - 19:30"),
      st("01bd4fc6-7ac1-4f34-a370-89cc967727b1", 1, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 18. E.C. Nampula
  church({
    id: "a1111111-1111-4111-8111-111111111105",
    church_name: "E.C. Nampula",
    public_name: "E.C. Nampula",
    type: "Igreja Local",
    province: "Nampula",
    city: "Nampula",
    district_or_area: "Amurane / Muhala",
    address: "Paragem Armazém, na rua do mercado Amurane",
    pastor_in_charge: "",
    phone_primary: "+258 86 759 6384",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111105", 0, "Quarta-feira", "Culto de Quarta-feira", "17:30 - 19:00"),
      st("a1111111-1111-4111-8111-111111111105", 1, "Domingo", "Culto de Domingo", "08:00 - 11:00"),
    ],
  }),

  // 19. E.C. Lichinga
  church({
    id: "ba7a28e9-ccd2-439e-9e78-bf9ab3259d1d",
    church_name: "E.C. Lichinga",
    public_name: "E.C. Lichinga",
    type: "Igreja Local",
    province: "Niassa",
    city: "Lichinga",
    district_or_area: "Nângala",
    address: "Av. Eduardo Mondlane, perto da Universidade Rovuma Niassa, Bairro Nângala",
    pastor_in_charge: "",
    phone_primary: "+258 84 900 1077",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("ba7a28e9-ccd2-439e-9e78-bf9ab3259d1d", 0, "Domingo", "Culto de Domingo", "09:00 - 11:00"),
    ],
  }),

  // 20. E.C. Dondo
  church({
    id: "d18a9a72-c9c0-4b82-94bc-5e0aeaac3b7f",
    church_name: "E.C. Dondo",
    public_name: "E.C. Dondo",
    type: "Igreja Local",
    province: "Sofala",
    city: "Dondo",
    district_or_area: "Vila de Dondo",
    address: "Complexo Maia & Dinis, EN6, Vila de Dondo",
    pastor_in_charge: "",
    phone_primary: "+258 85 693 9348",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [],
  }),

  // 21. E.C. Manga
  church({
    id: "c8bda7f4-be6a-49f8-8485-894e942cb693",
    church_name: "E.C. Manga",
    public_name: "E.C. Manga",
    type: "Igreja Local",
    province: "Sofala",
    city: "Beira",
    district_or_area: "Manga",
    address: "Rua 2, próximo ao supermercado Mutarara",
    pastor_in_charge: "",
    phone_primary: "+258 85 781 7483",
    phone_secondary: "+258 86 321 7166",
    email: "",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [],
  }),

  // E.C. Xai-Xai
  church({
    id: "ccf45f8f-8692-4556-a7a4-e98d6cc1d715",
    church_name: "E.C. Xai-Xai",
    public_name: "E.C. Xai-Xai",
    type: "Igreja Local",
    province: "Gaza",
    city: "Xai-Xai",
    district_or_area: "Xai-Xai",
    address: "",
    pastor_in_charge: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    status: "Activa",
    information_status: "Por Confirmar",
    custom_service_times: [],
  }),

  // E.C. Online
  church({
    id: "a1111111-1111-4111-8111-111111111107",
    church_name: "E.C. Online",
    public_name: "E.C. Online",
    type: "Igreja Online",
    province: "Online",
    city: "Online",
    district_or_area: "Virtual",
    address: "Transmissão online",
    pastor_in_charge: "Equipa de Media",
    phone_primary: "+258 86 877 389",
    phone_secondary: "",
    email: "online@embaixada-de-cristo.org",
    status: "Activa",
    information_status: "Confirmado",
    custom_service_times: [
      st("a1111111-1111-4111-8111-111111111107", 0, "Domingo", "Culto Online", "09:00 - 11:00", "Online"),
    ],
  }),
];
