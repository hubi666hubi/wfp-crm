export class MockServer {
  public routes = new Map<string, Function>();
  public callCount = new Map<string, number>();
  
  // Storage for mock data that might persist/change during a test
  public savedLeads: any[] = [];
  public inboundLeads: any[] = [];
  public messengerConfig = {
    pageAccessToken: 'zapalnik_token_vip_2026',
    verifyToken: 'zapalnik_token_vip_2026',
    autopilotEnabled: false
  };

  constructor() {
    this.setupRoutes();
    this.reset();
  }

  public reset() {
    this.callCount.clear();
    this.savedLeads = [
      {
        id: 'lead-default-1',
        authorName: 'Marek Karwowski',
        groupName: '🔥 [PRO BONO] Elitarne Rozwiązania Biznesowe z Ojcem',
        postText: 'Pilnie poszukuję doświadczonego partnera do automatyzacji procesów...',
        status: 'nowy',
        sentiment: 'high',
        score: 95,
        relativeTime: 'Przed chwilą'
      }
    ];
    this.inboundLeads = [
      {
        id: 'lead_1',
        name: 'Michal',
        status: 'Inbound (Wtyczka)',
        score: 90,
        bio: 'Startup Founder looking for sales tools',
        source: 'LinkedIn'
      }
    ];
    this.messengerConfig = {
      pageAccessToken: 'zapalnik_token_vip_2026',
      verifyToken: 'zapalnik_token_vip_2026',
      autopilotEnabled: false
    };
  }

  private setupRoutes() {
    // F1: Facebook Leads endpoints
    this.routes.set('GET:/api/messenger/config', () => {
      return this.messengerConfig;
    });

    this.routes.set('POST:/api/messenger/config', (body: any) => {
      this.messengerConfig = { ...this.messengerConfig, ...body };
      return { success: true };
    });

    this.routes.set('POST:/api/facebook/growth-machine', (body: any) => {
      return {
        steps: ['Krok 1: Określenie profilu idealnego klienta', 'Krok 2: Konfiguracja auto-komentarzy'],
        hook: `Super Hook dla oferty: ${body.offerDescription || 'Brak'}`,
        offerCopy: 'Skorzystaj z naszej elitarnej automatyzacji.'
      };
    });

    this.routes.set('POST:/api/facebook-leads/generate-simulated-post', (body: any) => {
      return {
        id: `sim-post-${Date.now()}`,
        authorName: 'Tomasz Nowak',
        groupName: 'Automatyzacja procesów biznesowych i AI',
        postText: `Szukam kogoś do wdrożenia CRM i AI, słowa kluczowe: ${(body.keywords || []).join(', ')}`,
        relativeTime: 'Przed chwilą'
      };
    });

    this.routes.set('POST:/api/facebook-leads/sentiment-analysis', (body: any) => {
      return {
        sentiment: 'Pozytywny (Wysoka Intencja Zakupowa)',
        score: 85,
        summary: `Analiza tekstu: ${body.text.substring(0, 30)}... Lead jest zdecydowany.`
      };
    });

    this.routes.set('POST:/api/facebook-leads/simulate-feed', () => {
      return [
        {
          id: 'sim-feed-1',
          authorName: 'Agnieszka Kowalska',
          groupName: 'Sztuczna Inteligencja dla Firm / Biznes',
          postText: 'Czy ktoś wdrażał już Gemini w obsłudze klienta w e-commerce?',
          relativeTime: '5 min temu'
        }
      ];
    });

    this.routes.set('GET:/api/facebook-leads', (body: any, params: URLSearchParams) => {
      return this.savedLeads;
    });

    this.routes.set('POST:/api/facebook-leads/analyze', (body: any) => {
      const newLead = {
        id: `analyzed-lead-${Date.now()}`,
        authorName: body.authorName || 'Anonim',
        groupName: body.groupName || 'Grupa FB',
        postText: body.postText,
        status: 'nowy',
        sentiment: 'Wysoki priorytet',
        score: 88,
        relativeTime: 'Przed chwilą'
      };
      this.savedLeads.push(newLead);
      return { success: true, lead: newLead };
    });

    this.routes.set('POST:/api/facebook-leads/delete', (body: any) => {
      this.savedLeads = this.savedLeads.filter(l => l.id !== body.leadId);
      return { success: true };
    });

    this.routes.set('POST:/api/facebook-leads/update-status', (body: any) => {
      this.savedLeads = this.savedLeads.map(l => l.id === body.leadId ? { ...l, status: body.status } : l);
      return { success: true };
    });

    // F2: VSL Generator endpoints
    this.routes.set('POST:/api/generate-vsl', (body: any) => {
      return {
        scriptParts: [
          { index: 0, title: 'Hak (Hook)', text: `Czy masz problem z: ${body.mainProblem}? Witaj w ${body.productName}!` },
          { index: 1, title: 'Ból (Pain)', text: `Wiemy, że ${body.topic} to koszmar.` },
          { index: 2, title: 'Rozwiązanie (Solution)', text: `Nasze korzyści: ${body.keyBenefits}.` }
        ]
      };
    });

    this.routes.set('POST:/api/generate-outreach', (body: any) => {
      return {
        subject: `Rozwiązanie problemu z ${body.mainProblem || 'automatyzacją'}`,
        body: `Witaj ${body.clientName || 'Klient'},\n\nPrzygotowaliśmy spersonalizowany skrypt VSL dla Ciebie.`
      };
    });

    // F3: Zapalnik CRM endpoints
    this.routes.set('GET:/api/inbound-leads', () => {
      return this.inboundLeads;
    });

    this.routes.set('POST:/api/inbound-lead/status', (body: any) => {
      this.inboundLeads = this.inboundLeads.map(l => l.id === body.leadId ? { ...l, status: body.status } : l);
      return { success: true };
    });

    this.routes.set('POST:/api/inbound-lead', (body: any) => {
      const newLead = {
        id: `manual-inbound-${Date.now()}`,
        name: body.name,
        bio: body.bio,
        source: body.source || 'LinkedIn',
        status: 'Inbound (Wtyczka)',
        score: body.bio.length > 50 ? 95 : 75
      };
      this.inboundLeads.push(newLead);
      return { success: true, lead: newLead };
    });

    this.routes.set('POST:/api/inbound-lead/enrich', (body: any) => {
      return {
        enrichment: {
          bio: 'Enriched bio details for sales rep',
          painPoints: ['Czasochłonny proces pozyskiwania leadów', 'Brak automatyzacji DMs'],
          objections: ['Wysoka cena abonamentu', 'Obawa przed brakiem elastyczności']
        }
      };
    });

    this.routes.set('POST:/api/inbound-lead/sequence', (body: any) => {
      return {
        sequence: [
          { step: 1, type: 'Wstępne zapytanie', content: 'Cześć! Widziałem twój post o automatyzacji...' },
          { step: 2, type: 'Prezentacja wartości', content: 'Przygotowaliśmy krótki materiał o optymalizacji...' },
          { step: 3, type: 'Przełamanie oporów', content: 'Rozumiem Twoje obawy odnośnie ceny...' },
          { step: 4, type: 'Call to Action', content: 'Może krótka 10-minutowa rozmowa w czwartek o 14?' }
        ]
      };
    });

    this.routes.set('POST:/api/inbound-lead/pitch-card', (body: any) => {
      return {
        pitchCard: {
          offer: 'Dedykowany system pozyskiwania leadów z Facebooka',
          htmlEmail: '<html><body><h1>Oferta VIP</h1><p>Pozyskaj 10x więcej leadów bez reklam</p></body></html>'
        }
      };
    });

    this.routes.set('POST:/api/inbound-lead/tactical-brief', (body: any) => {
      return {
        brief: {
          battlecard: '=== SDR COMBAT BRIEF ===\nTarget: High Intent Founder\nStrategy: Direct MEDDPICC qualification.',
          meddpicc: 'Metrics: $10k/mo savings\nEconomic Buyer: CEO\nDecision Criteria: ROI in 30 days.'
        }
      };
    });

    this.routes.set('POST:/api/inbound-lead/chat', (body: any) => {
      const msg = body.message || '';
      let reply = 'Ciekawe rozwiązanie, ale nie wiem czy mamy na to budżet w tym kwartale.';
      if (msg.toLowerCase().includes('budżet') || msg.toLowerCase().includes('cena')) {
        reply = 'Rozumiem. Jaki koszt wdrożenia szacujecie na start?';
      } else if (msg.toLowerCase().includes('darmow') || msg.toLowerCase().includes('test')) {
        reply = 'Chętnie przetestuję system w wersji trial!';
      }
      return { reply };
    });

    this.routes.set('POST:/api/inbound-lead/chat/history', () => {
      return { success: true };
    });

    // F4: AI Studio calls with key rotation
    this.routes.set('POST:/api/handle-aistudio-call', (body: any) => {
      const { supabaseUrl, supabaseServiceRoleKey, geminiApiKey, query } = body;
      
      if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey || !query) {
        return {
          status: 400,
          body: { error: 'Missing mandatory parameters.' }
        };
      }

      if (geminiApiKey === 'exhausted_key') {
        return {
          status: 429,
          body: {
            error: 'Quota exhausted',
            rotated: true,
            nextKeyPlaceholder: 'rotated_fallback_key_2026'
          }
        };
      }

      return {
        status: 200,
        body: [
          {
            id: 'doc_vector_1',
            content: `Dopasowany fragment bazy wiedzy na zapytanie: ${query}`,
            similarity: 0.96
          }
        ]
      };
    });
  }

  public handle(url: string, options: any) {
    const method = options?.method || 'GET';
    const parsedUrl = new URL(url, 'http://localhost');
    const cleanPath = parsedUrl.pathname;
    const routeKey = `${method}:${cleanPath}`;
    
    this.callCount.set(routeKey, (this.callCount.get(routeKey) || 0) + 1);
    
    const handler = this.routes.get(routeKey);
    if (!handler) {
      return { status: 404, body: { error: `Not found: ${routeKey}` } };
    }
    
    const body = options?.body ? JSON.parse(options.body) : {};
    const result = handler(body, parsedUrl.searchParams);
    
    if (result && typeof result.status === 'number') {
      return result;
    }
    return { status: 200, body: result };
  }
}

// Instantiate and expose globally
export const mockServer = new MockServer();

// Overwrite fetch globally
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : (input as any).url || input.toString();
  
  if (url.startsWith('/api/') || url.includes('/api/')) {
    const response = await mockServer.handle(url, init);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status === 200 ? 'OK' : 'Error',
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as unknown as Response;
  }
  
  if (url.includes('googleapis.com')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'google_api_file_mock_id', status: 'sent' }),
      text: async () => JSON.stringify({ id: 'google_api_file_mock_id', status: 'sent' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as unknown as Response;
  }
  
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: `URL not mocked: ${url}` }),
    text: async () => `URL not mocked: ${url}`,
  } as unknown as Response;
};
