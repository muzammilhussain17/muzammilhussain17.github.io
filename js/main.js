// ======================================
// BLUEPRINT / TECHNICAL THEME v2.0
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    renderSystems();
});

function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => menu.classList.toggle('active'));
        menu.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => menu.classList.remove('active'));
        });
    }
}

// Systems with full detail: problem, architecture, diagram, security, scalability, failure
const systems = [
    {
        id: 'SYS-001',
        title: 'AUTHENTICATION & AUTHORIZATION SYSTEM',
        problem: 'Enterprise applications require stateless authentication that scales horizontally, with fine-grained access control and protection against token theft and replay attacks.',
        architecture: 'Stateless JWT-based auth with refresh token rotation. Access tokens short-lived (15min), refresh tokens stored in Redis with device binding. Role-based access enforced at method and endpoint level via Spring Security.',
        diagram: `
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  Client │────▶│  API Gateway │────▶│  Auth Service│────▶│  Redis  │
└─────────┘     └─────────────┘     └─────────────┘     └─────────┘
     │                 │                    │                 │
     │   JWT Token     │   Validate Token   │   Store/Check   │
     │◀────────────────│◀───────────────────│   Refresh Token │
     │                 │                    │                 │
     │                 ▼                    │                 │
     │          ┌─────────────┐             │                 │
     │          │  Protected  │◀────────────┘                 │
     │          │   Service   │   @PreAuthorize               │
     │          └─────────────┘   Method-level RBAC           │
`,
        security: 'BCrypt password hashing, JWT signature verification, refresh token rotation on each use, CORS whitelist, CSRF protection on state-changing endpoints',
        scalability: 'Designed for horizontal scaling behind load balancer. Stateless tokens eliminate session affinity. Redis cluster for token storage.',
        failure: 'Token expiration forces re-auth. Compromised refresh token detected via rotation — old token invalidated. Redis failure degrades to DB lookup with circuit breaker.',
        stack: ['Spring Boot', 'Spring Security', 'PostgreSQL', 'Redis', 'JWT'],
        github: '#'
    },
    {
        id: 'SYS-002',
        title: 'E-COMMERCE MODULAR MONOLITH BACKEND',
        problem: 'Monolithic e-commerce systems create deployment bottlenecks and cannot scale individual components independently during traffic spikes.',
        architecture: 'Decomposed into modules like Product, Order, Inventory, User services. Each module has its own configuration. It helps to handle routing, rate limiting, and auth propagation.',
        diagram: `
 ┌─────────────────────────────────────────────────┐
│              CRAFTISTAN BACKEND                  │
│         (Spring Boot + Postgresql + MongoDB)                  │
└──────────────────────┬──────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌────────┐      ┌───────────┐      ┌──────────┐
│ Config │      │    App    │      │  Uploads │
│────────│      │───────────│      │──────────│
│Security│      │Craftistan │      │  Static  │
│JWT Auth│      │Application│      │  Files   │
│Web/CORS│      │  (Main)   │      │          │
│JPA     │      └───────────┘      └──────────┘
│DataInit│
└────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │           MODULES (Layered)       │
     ▼                                   ▼
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────┐  ┌───────┐  ┌───────┐  ┌─────┐  │
│   │ Auth │  │Product│  │ Order │  │User │  │
│   └──┬───┘  └──┬────┘  └──┬────┘  └──┬──┘  │
│      │         │          │          │      │
│   ┌──────┐  ┌───────┐  ┌───────┐  ┌─────┐  │
│   │ Chat │  │Review │  │Wishlst│  │Artsn│  │
│   └──┬───┘  └──┬────┘  └──┬────┘  └──┬──┘  │
│      │         │          │          │      │
│   ┌──────┐  ┌───────┐                      │
│   │Upload│  │Transl.│     ┌────────┐        │
│   └──────┘  └───────┘     │ Common │        │
│                           └────────┘        │
└─────────────────────────────────────────────┘

     Each module follows this pattern:
    ┌──────────────────────────────┐
    │         MODULE               │
    │  ┌────────────────────────┐  │
    │  │     Controller         │  │  ← REST API endpoints
    │  ├────────────────────────┤  │
    │  │     Service            │  │  ← Business logic
    │  ├────────────────────────┤  │
    │  │     Repository         │  │  ← MongoDB data access
    │  ├────────────────────────┤  │
    │  │     Entity             │  │  ← Data models
    │  ├────────────────────────┤  │
    │  │     DTO                │  │  ← Request/Response objects
    │  └────────────────────────┘  │
    └──────────────────────────────┘

     Request flow:
    ┌────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌───────┐
    │ Client ├───►│JWT Filter├───►│Controller├───►│ Service  ├───►│MongoDB│
    └────────┘    └──────────┘    └─────────┘    └──────────┘    └───────┘
`,
        security: 'Service-to-service auth via internal JWT. User context propagated in headers. Each service validates permissions independently.',
        scalability: 'Services scale independently based on load. Product catalog read-heavy — scaled with MongoDB replicas. Orders write-heavy — PostgreSQL with connection pooling.',
        failure: 'Circuit breakers prevent cascade failures. Inventory check failure triggers order hold, not rejection. Eventual consistency via retry queues.',
        stack: ['Spring Boot', 'Spring Cloud', 'PostgreSQL', 'MongoDB', 'Docker'],
        github: '#'
    },
    {
        id: 'SYS-003',
        title: 'ASYNC ORDER PROCESSING SYSTEM',
        problem: 'Synchronous order processing blocks HTTP threads during payment and inventory operations, causing timeouts under load and poor user experience.',
        architecture: 'Producer-consumer pattern with RabbitMQ. HTTP request accepts order immediately, returns 202 Accepted. Worker consumers process orders from queue. Dead letter queue captures failures for retry and manual review.',
        diagram: `
┌─────────┐   POST /orders   ┌─────────────┐   Publish   ┌─────────────┐
│  Client │─────────────────▶│  Order API  │────────────▶│  RabbitMQ   │
└─────────┘                  └─────────────┘             └──────┬──────┘
     │                              │                          │
     │   202 Accepted               │                          │
     │   + Order ID                 │                    ┌─────▼─────┐
     │◀─────────────────────────────┘                    │  Exchange │
     │                                                   └─────┬─────┘
     │                                                         │
     │    ┌────────────────────────────────────────────────────┤
     │    │                              │                     │
     │    ▼                              ▼                     ▼
     │  ┌──────────┐              ┌──────────┐          ┌──────────┐
     │  │ Worker 1 │              │ Worker 2 │          │   DLQ    │
     │  └────┬─────┘              └────┬─────┘          │ (Retry)  │
     │       │                         │                └──────────┘
     │       ▼                         ▼
     │  ┌─────────┐               ┌─────────┐
     │  │   DB    │               │ Payment │
     │  └─────────┘               │   API   │
     │                            └─────────┘
`,
        security: 'Message signing prevents tampering. Consumer validates order ownership before processing. Sensitive data encrypted in queue.',
        scalability: 'Add workers to increase throughput. Queue acts as buffer during spikes. Prefetch count tuned to prevent worker overload.',
        failure: 'Failed messages route to DLQ with retry count. 3 retries with exponential backoff. Poison messages flagged for manual review. Idempotent processing prevents duplicate orders.',
        stack: ['Spring Boot', 'RabbitMQ', 'PostgreSQL', 'Docker Compose'],
        github: '#'
    },
    {
        id: 'SYS-004',
        title: 'PRODUCTION REST API TEMPLATE',
        problem: 'APIs without consistent error handling, response formats, and documentation create friction for frontend teams and make production debugging difficult.',
        architecture: 'Resource-oriented design with proper HTTP semantics. Global exception handler produces RFC 7807 problem details. OpenAPI spec generated from code annotations. Cursor-based pagination for large datasets.',
        diagram: `
┌─────────────────────────────────────────────────────────────────┐
│                        API STRUCTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Request ──▶ Filter Chain ──▶ Controller ──▶ Service ──▶ Repo │
│      │            │                │              │             │
│      │      ┌─────▼─────┐    ┌─────▼─────┐       │             │
│      │      │  Logging  │    │ Validation│       │             │
│      │      │  Auth     │    │ @Valid    │       │             │
│      │      │  RateLimit│    └───────────┘       │             │
│      │      └───────────┘                        │             │
│      │                                           │             │
│      │   ┌───────────────────────────────────────┘             │
│      │   │                                                     │
│      │   ▼                                                     │
│      │  Exception? ──▶ GlobalExceptionHandler ──▶ RFC 7807    │
│      │                                                         │
│      ▼                                                         │
│   Response: { data, pagination, _links }                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
`,
        security: 'Request validation on all inputs. SQL injection prevented via parameterized queries. Response sanitization. Rate limiting per client.',
        scalability: 'Stateless design. Connection pooling. Query optimization with proper indexing. Response caching for read-heavy endpoints.',
        failure: 'Consistent error responses across all endpoints. Correlation IDs for request tracing. Health checks for dependencies. Graceful degradation when non-critical services fail.',
        stack: ['Spring Boot', 'OpenAPI', 'JPA', 'PostgreSQL', 'JUnit'],
        github: '#'
    }
];

function renderSystems() {
    const container = document.getElementById('systems-list');
    if (!container) return;

    container.innerHTML = systems.map(sys => `
        <article class="system-card" id="${sys.id.toLowerCase().replace('-', '-')}">
            <div class="system-card__header">
                <span class="system-card__id">${sys.id}</span>
                <a href="${sys.github}" class="system-card__link" target="_blank">[GITHUB]</a>
            </div>
            <div class="system-card__body">
                <h3 class="system-card__title">${sys.title}</h3>
                
                <div class="system-card__diagram">
                    <pre>${sys.diagram.trim()}</pre>
                </div>
                
                <div class="system-card__grid">
                    <div class="system-card__section">
                        <h4>PROBLEM</h4>
                        <p>${sys.problem}</p>
                    </div>
                    <div class="system-card__section">
                        <h4>ARCHITECTURE</h4>
                        <p>${sys.architecture}</p>
                    </div>
                </div>
                
                <div class="system-card__specs">
                    <div class="system-card__spec">
                        <span class="system-card__spec-label">SECURITY</span>
                        <span class="system-card__spec-value">${sys.security}</span>
                    </div>
                    <div class="system-card__spec">
                        <span class="system-card__spec-label">SCALABILITY</span>
                        <span class="system-card__spec-value">${sys.scalability}</span>
                    </div>
                    <div class="system-card__spec">
                        <span class="system-card__spec-label">FAILURE HANDLING</span>
                        <span class="system-card__spec-value">${sys.failure}</span>
                    </div>
                </div>
                
                <div class="system-card__stack">
                    ${sys.stack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');
}



