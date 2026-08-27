/**
 * Docker & Containerization Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const dockerCurriculum = {
  title: 'Docker & Containerization',
  category: 'Cloud & DevOps',
  description: 'Master Docker container lifecycle, multi-stage Dockerfiles, Docker Compose service stacks, networking, volumes, and CI/CD container automation.',
  modules: [
    {
      title: 'Phase 1: Container Fundamentals & Docker Architecture',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'Docker Architecture, Images & Container Lifecycle',
          description: 'Understand how the Docker daemon, images, container isolation (cgroups, namespaces), and registry repositories operate.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand Linux kernel namespaces and cgroups for process isolation',
            'Master Docker CLI container lifecycle commands (run, ps, logs, exec, stop, rm)',
            'Configure container port mapping (-p) and environment variables (-e)',
            'Inspect and manage image layers with the overlay2 storage driver'
          ],
          introduction: `Docker is an open-source platform that automates the deployment of applications inside lightweight, portable containers. 

Before containerization, applications were deployed directly onto Bare Metal servers or Virtual Machines (VMs). Virtual Machines require a full Guest Operating System running on top of a Hypervisor (such as VMware or Hyper-V), which consumes gigabytes of RAM, takes minutes to boot, and creates significant CPU overhead.

Docker solves this by using OS-level virtualization. Containers run directly on the host Linux kernel, sharing the host OS while maintaining complete process, network, and filesystem isolation. This allows containers to start in milliseconds while consuming only megabytes of memory.`,
          deepDiveSections: [
            {
              title: 'How Docker Achieves Isolation (Linux Kernel Primitives)',
              explanation: `Docker is not a virtual machine. It achieves complete isolation using two foundational Linux kernel features:
1. Namespaces (What a process can SEE):
   • PID Namespace: Gives the container its own isolated process tree (the container's main process runs as PID 1 inside the container).
   • NET Namespace: Provides an isolated network stack (independent IP address, routing table, and port bindings).
   • MNT Namespace: Isolates filesystem mount points, so the container cannot see the host's root filesystem unless explicitly mounted.
   • IPC Namespace: Prevents inter-process communication between container and host processes.
   • UTS Namespace: Allows the container to have its own isolated hostname.

2. Control Groups / cgroups (What a process can USE):
   • Enforces strict hardware resource limits on CPU usage, RAM allocation, disk I/O bandwidth, and network throughput.
   • If a container exceeds its memory limit (OOM), the Linux kernel terminates the container without crashing the host operating system.`,
              keyPoint: 'Namespaces isolate the environment view; Control Groups (cgroups) meter and restrict physical resource consumption.'
            },
            {
              title: 'The Docker Engine Architecture & Components',
              explanation: `The Docker Engine operates as a client-server architecture consisting of three core layers:
1. Docker Client (CLI): The command-line tool (docker run, docker build) that users interact with. It communicates with the daemon via REST API over UNIX domain sockets or TCP.
2. Docker Daemon (dockerd): The persistent background service that manages container objects (images, containers, networks, volumes).
3. containerd & runc: The industry-standard OCI (Open Container Initiative) compliant container runtime that directly interfaces with the Linux kernel to instantiate namespaces and cgroups.`,
              keyPoint: 'The Docker CLI is just a thin REST client; dockerd, containerd, and runc perform the actual kernel process isolation.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Virtual Machines vs. Docker Containers',
            headers: ['Feature', 'Virtual Machines (VMs)', 'Docker Containers'],
            rows: [
              ['Architecture', 'Hypervisor + Full Guest OS per VM', 'Shared Host Kernel + Userland Isolation'],
              ['Startup Time', 'Minutes (full OS boot process)', 'Milliseconds (direct process launch)'],
              ['Storage Size', 'Gigabytes to Tens of GBs (Guest OS)', 'Megabytes (application & libraries only)'],
              ['Resource Overhead', 'High (RAM/CPU reserved per VM)', 'Near-zero overhead (native host performance)']
            ]
          },
          coreConcepts: [
            'Process isolation via Linux PID, NET, and MNT Namespaces',
            'Hardware quota metering and OOM protection via cgroups',
            'Layered Copy-on-Write filesystem backed by the overlay2 driver'
          ],
          syntax: `# Core Docker CLI Commands
docker run -d --name web-service -p 8080:80 --restart unless-stopped nginx:alpine
docker ps -a
docker logs -f --tail 100 web-service
docker exec -it web-service sh
docker stop web-service && docker rm web-service`,
          codeExamples: [
            {
              language: 'bash',
              code: `docker run -d \\
  --name prod-postgres \\
  -e POSTGRES_USER=zenscore_admin \\
  -e POSTGRES_PASSWORD=supersecretpass \\
  -e POSTGRES_DB=zenscore_db \\
  -p 5432:5432 \\
  -v postgres_data:/var/lib/postgresql/data \\
  postgres:16-alpine`,
              explanation: 'Starts PostgreSQL in the background with environment variables and named volume mounting.'
            }
          ],
          commonMistakes: [
            'Storing persistent application data inside the container writable layer instead of mounted Docker volumes',
            'Running container processes as the default root user in production environments'
          ],
          bestPractices: [
            'Always assign explicit container names (--name) and restart policies',
            'Use lightweight base images (alpine or distroless) to minimize security vulnerability surfaces'
          ],
          summary: `Docker achieves lightweight, high-performance containerization by sharing the host Linux kernel while enforcing strict process isolation via namespaces and resource quotas via cgroups.`,
          resources: [
            { title: 'Docker Official Getting Started Guide', url: 'https://docs.docker.com/get-started/overview/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 20 },
            { title: 'GeeksforGeeks — Docker Architecture & Lifecycle', url: 'https://www.geeksforgeeks.org/docker-architecture/', provider: 'GeeksforGeeks', type: 'Article', difficulty: 'Beginner', estimatedMinutes: 25 }
          ],
          assessment: {
            questions: [
              {
                id: 'd1_q1',
                question: 'Which Linux kernel primitive is responsible for isolating what a Docker container process can SEE (e.g. process tree, network interfaces, filesystem)?',
                options: [
                  'Linux Namespaces (PID, NET, MNT)',
                  'Control Groups (cgroups)',
                  'Hypervisor Type 2',
                  'WiredTiger Storage Engine'
                ],
                correctIndex: 0,
                topic: 'Linux Kernel Isolation',
                explanation: 'Linux Namespaces isolate the environment view (PID for processes, NET for networks, MNT for filesystems), whereas cgroups enforce resource usage quotas.'
              },
              {
                id: 'd1_q2',
                question: 'When executing `docker run -p 8080:3000 my-app`, which port is exposed on the host machine and which port is the application listening on inside the container?',
                options: [
                  'Host port: 8080, Container port: 3000',
                  'Host port: 3000, Container port: 8080',
                  'Both host and container listen on port 8080',
                  'Port 8080 is a random seed and port 3000 is blocked'
                ],
                correctIndex: 0,
                topic: 'Port Mapping Syntax',
                explanation: 'The `-p` syntax is `-p <HostPort>:<ContainerPort>`. Requests to host port 8080 are forwarded to the container application listening on port 3000.'
              },
              {
                id: 'd1_q3',
                question: 'What happens when a container exceeds the memory limits configured via cgroups?',
                options: [
                  'The Linux OOM (Out Of Memory) killer halts the container without crashing the host',
                  'The host operating system kernel panics and reboots',
                  'The container CPU slows down to 10%',
                  'Docker automatically scales up the host RAM'
                ],
                correctIndex: 0,
                topic: 'cgroups & OOM Killer',
                explanation: 'Control Groups isolate hardware bounds. When exceeded, the Linux OOM killer terminates the offending container process safely without affecting host stability.'
              }
            ]
          },
          practicalTask: {
            title: 'Launch & Configure a Containerized Service',
            difficulty: 'Beginner',
            problemStatement: 'Write the complete Docker CLI command to run an Nginx container in detached mode with name `web-server`, host port 80 mapped to container port 80, restart policy `always`, and volume `web_assets` mounted to `/usr/share/nginx/html` using image `nginx:alpine`.',
            instructions: 'Combine the flags -d, --name, -p, -v, --restart, and the image name in a single valid command.',
            requirements: [
              'Use detached flag -d',
              'Specify container name --name web-server',
              'Bind host port 80 to container port 80 (-p 80:80)',
              'Mount named volume web_assets to /usr/share/nginx/html (-v web_assets:/usr/share/nginx/html)',
              'Set --restart always with image nginx:alpine'
            ],
            starterCode: `# TODO: Write your docker run command below:\ndocker run `,
            solutionCode: `docker run -d --name web-server -p 80:80 -v web_assets:/usr/share/nginx/html --restart always nginx:alpine`,
            hints: ['Flag order: -d --name <name> -p <host>:<container> -v <volume>:<mountpath> --restart always <image>']
          }
        },
        {
          lessonNumber: 2,
          title: 'Multi-Stage Production Dockerfiles',
          description: 'Construct optimized, secure Docker images using multi-stage builds, non-root users, .dockerignore, and layer caching.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Differentiate build-time tools (Compilers, SDKs) from runtime dependencies',
            'Implement multi-stage Docker builds to reduce image size by up to 90%',
            'Leverage Docker layer caching by ordering instructions strategically',
            'Enforce non-root security principles using USER directives'
          ],
          introduction: `A single-stage Dockerfile bundles source code, build dependencies (compilers, npm devDependencies, test runners), and runtime tools into a single heavy image (often 1GB+).

Multi-stage builds allow developers to create multiple temporary stages within a single Dockerfile. The final stage copies only the compiled build artifacts into a clean, minimal runtime image (such as alpine or distroless), slashing image size from 1.2GB down to 60MB while removing build tool security vulnerabilities.`,
          deepDiveSections: [
            {
              title: 'Multi-Stage Build Architecture & Mechanics',
              explanation: `A multi-stage Dockerfile defines separate build environments using multiple FROM statements:
1. Stage 1 (Builder Stage): Named via \`FROM node:20-alpine AS builder\`. Installs full SDKs, devDependencies, and compiles TypeScript/React code into production bundles.
2. Stage 2 (Production Runner): Defined via \`FROM node:20-alpine AS runner\`. Only copies production dependencies (\`npm ci --only=production\`) and compiled artifacts from the builder stage via \`COPY --from=builder /app/dist ./dist\`.
3. Garbage Collection: Docker automatically discards the intermediate builder stage filesystem layers, keeping only the lightweight runner image in storage.`,
              keyPoint: 'Multi-stage builds ensure compilers and SDKs never reach production containers, drastically shrinking image size and attack surface.'
            },
            {
              title: 'Docker Layer Caching & Build Optimization',
              explanation: `Docker caches every instruction layer (FROM, RUN, COPY). When a file changes, Docker invalidates the cache for that step and ALL subsequent steps.
To maximize cache hit rate:
• Copy package.json and lockfiles first: \`COPY package*.json ./\` followed by \`RUN npm ci\`.
• Only then copy the remaining source code: \`COPY . .\`.
This ensures Docker does not reinstall npm packages on every minor code edit!`,
              keyPoint: 'Place infrequently changed instructions (dependency manifests) before frequently changed source code to preserve layer caching.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Single-Stage vs. Multi-Stage Docker Builds',
            headers: ['Metric', 'Single-Stage Dockerfile', 'Multi-Stage Dockerfile'],
            rows: [
              ['Image Size', '1.2 GB – 1.8 GB (Includes full SDKs)', '45 MB – 85 MB (Runtime binaries only)'],
              ['Security Vulnerabilities', 'High (Compiler tools and dev packages in prod)', 'Minimal (Zero build tools or package managers in prod)'],
              ['Build Cache Efficiency', 'Low (Rebuilds dependencies on code change)', 'High (Independent caching per build stage)'],
              ['CI/CD Transfer Time', 'Minutes over network registries', 'Seconds for lightning-fast container deployments']
            ]
          },
          coreConcepts: [
            'Multi-stage segregation with `FROM ... AS builder` and `COPY --from=builder`',
            'Strategic instruction ordering to maximize Docker build layer caching',
            'Non-root user execution (`USER node`) to eliminate container breakout risks'
          ],
          syntax: `# Production Multi-Stage Dockerfile Pattern
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `# Stage 1: Build & Package
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal Distroless / Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
EXPOSE 5000
CMD ["node", "dist/index.js"]`,
              explanation: 'Production Node.js multi-stage build running under the non-root node user.'
            }
          ],
          commonMistakes: [
            'Copying all source files before package.json, which invalidates the npm dependency cache on every single line edit',
            'Omitting a .dockerignore file, causing node_modules, local .env files, and git history to be baked into images'
          ],
          bestPractices: [
            'Always maintain a strict .dockerignore containing node_modules, .git, .env*, and test coverage directories',
            'Use --chown=node:node when copying files to ensure non-root users own the application files'
          ],
          summary: `Multi-stage builds eliminate heavy build tools from production images, achieving sub-100MB container footprints with ironclad non-root security.`,
          resources: [
            { title: 'Docker Official Multi-Stage Build Documentation', url: 'https://docs.docker.com/build/building/multi-stage/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 },
            { title: 'GeeksforGeeks — Best Practices for Writing Production Dockerfiles', url: 'https://www.geeksforgeeks.org/best-practices-for-writing-dockerfiles/', provider: 'GeeksforGeeks', type: 'Article', difficulty: 'Intermediate', estimatedMinutes: 25 }
          ],
          assessment: {
            questions: [
              {
                id: 'd2_q1',
                question: 'Why is it standard practice to copy package.json and run `npm ci` before copying the rest of the application source code in a Dockerfile?',
                options: [
                  'To leverage Docker layer caching and prevent re-downloading dependencies when source code changes',
                  'Because npm requires files in alphabetical order',
                  'To prevent Linux kernel crashes',
                  'Because Docker cannot execute COPY commands on folders'
                ],
                correctIndex: 0,
                topic: 'Docker Layer Caching',
                explanation: 'Docker caches layers sequentially. If package.json has not changed, Docker reuses the cached node_modules layer, speeding up subsequent builds by 90%.'
              },
              {
                id: 'd2_q2',
                question: 'In a multi-stage Dockerfile, how do you copy compiled output from an earlier stage named `builder` into the current stage?',
                options: [
                  'COPY --from=builder /app/dist ./dist',
                  'IMPORT /app/dist FROM builder',
                  'DOCKER_COPY builder:/app/dist ./dist',
                  'RUN cp -r builder:/app/dist ./dist'
                ],
                correctIndex: 0,
                topic: 'Multi-Stage COPY Syntax',
                explanation: 'The `COPY --from=<stage_name>` instruction copies files directly from a named intermediate build stage into the final image.'
              }
            ]
          },
          practicalTask: {
            title: 'Build a Multi-Stage Node.js Production Dockerfile',
            difficulty: 'Intermediate',
            problemStatement: 'Complete the production multi-stage Dockerfile for a Node.js API with a `builder` stage that compiles TypeScript and a `runner` stage that runs under the non-root `node` user with `NODE_ENV=production`.',
            instructions: 'Fill in the builder stage definition, layer cache copy, build execution, runner stage, non-root user directive, and CMD entrypoint.',
            requirements: [
              'Define builder stage: FROM node:20-alpine AS builder',
              'Copy package*.json and run npm ci',
              'Copy source and run npm run build',
              'Define runner stage: FROM node:20-alpine AS runner',
              'Set ENV NODE_ENV=production and USER node',
              'Copy --from=builder /app/dist ./dist and set CMD ["node", "dist/server.js"]'
            ],
            starterCode: `# TODO: Complete the multi-stage Dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\n`,
            solutionCode: `FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY --from=builder /app/dist ./dist\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/server.js"]`,
            hints: ['Remember to define both AS builder and AS runner, copy artifacts via COPY --from=builder, and enforce USER node.']
          }
        },
        {
          lessonNumber: 3,
          title: 'Docker Networking Fundamentals',
          description: 'Master Docker bridge, host, none, and overlay networks, inter-container DNS resolution, and port binding mechanics.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand default bridge vs custom user-defined bridge networks',
            'Resolve containers by service name via Docker embedded DNS server (127.0.0.11)',
            'Configure network isolation between microservices',
            'Inspect network drivers and container IP allocations'
          ],
          introduction: `By default, containers can communicate with the outside world, but cannot discover other containers unless they share a network.

Docker networking provides the communication fabric for containerized architectures. Custom user-defined bridge networks enable automatic internal DNS resolution, allowing containers to call each other via simple hostnames (e.g. \`http://auth-service:5000\`) without hardcoding volatile container IP addresses.`,
          deepDiveSections: [
            {
              title: 'Docker Network Drivers & Topology',
              explanation: `Docker provides four primary networking drivers:
1. Bridge (Default): Creates a private virtual network on the host. Containers receive an IP (e.g. 172.18.0.2). User-defined bridge networks provide automatic DNS resolution.
2. Host: Removes network isolation between the container and the Docker host, using the host network stack directly for maximum raw throughput.
3. None: Completely disables networking for a container (used for offline batch processing).
4. Overlay: Spans multiple Docker daemon hosts in Docker Swarm or Kubernetes clusters for distributed container communication.`,
              keyPoint: 'User-defined bridge networks provide automatic service discovery; the default bridge network does not.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Default Bridge vs. User-Defined Bridge Networks',
            headers: ['Feature', 'Default Bridge (bridge)', 'User-Defined Bridge Network'],
            rows: [
              ['Automatic DNS Resolution', 'No (Must link via legacy --link or manual IPs)', 'Yes (Resolves containers by container name/alias)'],
              ['Network Isolation', 'All default containers share the same network', 'Isolated to containers explicitly attached'],
              ['Hot-Plugging', 'Cannot connect/disconnect running containers', 'Can attach and detach live containers dynamically'],
              ['Security', 'Lower (Unrelated containers can ping each other)', 'Higher (Strict boundary between service tiers)']
            ]
          },
          coreConcepts: [
            'User-defined bridge network creation via `docker network create`',
            'Embedded Docker DNS server (127.0.0.11) resolving container names to IP addresses',
            'Multi-homed containers connecting frontend and backend networks'
          ],
          syntax: `# Docker Network Management Commands
docker network create --driver bridge app-network
docker run -d --name db --network app-network mongo:latest
docker run -d --name api --network app-network -p 5000:5000 my-api
docker network inspect app-network
docker network disconnect app-network db`,
          codeExamples: [
            {
              language: 'bash',
              code: `# 1. Create dedicated network
docker network create backend-net

# 2. Run Database on network
docker run -d --name redis-cache --network backend-net redis:alpine

# 3. Connect API to Redis by name
docker run -d --name node-app --network backend-net -e REDIS_HOST=redis-cache -p 3000:3000 my-node-app`,
              explanation: 'Node.js connects to Redis using its container name redis-cache via internal Docker DNS.'
            }
          ],
          commonMistakes: [
            'Trying to connect to localhost inside a container expecting to reach another container',
            'Using the default bridge network and expecting container names to resolve automatically'
          ],
          bestPractices: [
            'Always create custom user-defined bridge networks for multi-container applications',
            'Isolate database networks from public frontend networks using multi-tier network topologies'
          ],
          summary: `User-defined bridge networks enable seamless inter-container communication via built-in DNS resolution and provide robust microservice isolation.`,
          resources: [
            { title: 'Docker Networking Overview', url: 'https://docs.docker.com/network/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }
          ],
          assessment: {
            questions: [
              {
                id: 'd3_q1',
                question: 'What is the primary advantage of a user-defined bridge network over the default bridge network in Docker?',
                options: [
                  'Automatic DNS resolution between containers using container names',
                  'It bypasses the Linux kernel for zero latency',
                  'It automatically encrypts all database queries with SSL',
                  'It makes container images smaller'
                ],
                correctIndex: 0,
                topic: 'Docker DNS Resolution',
                explanation: 'User-defined bridge networks include automatic DNS lookup by container name, allowing services to communicate without hardcoded IP addresses.'
              }
            ]
          },
          practicalTask: {
            title: 'Create an Isolated Network & Connect Services',
            difficulty: 'Beginner',
            problemStatement: 'Write the shell commands to create a user-defined bridge network named `prod-net` and run a MongoDB container named `mongo-db` attached to `prod-net`.',
            instructions: 'Create the network first, then launch the detached container on that network.',
            requirements: [
              'docker network create prod-net',
              'docker run -d --name mongo-db --network prod-net mongo:7'
            ],
            starterCode: `# Step 1: Create network\n\n# Step 2: Run container on network\n`,
            solutionCode: `docker network create prod-net\ndocker run -d --name mongo-db --network prod-net mongo:7`,
            hints: ['Use docker network create <name> and docker run -d --name <name> --network <net> <image>.']
          }
        }
      ]
    },
    {
      title: 'Phase 2: Docker Compose & Multi-Service Applications',
      order: 2,
      lessons: [
        {
          lessonNumber: 4,
          title: 'Docker Compose Fundamentals',
          description: 'Orchestrate multi-container applications declaratively using docker-compose.yml files, services, networks, and depends_on directives.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Write clean, declarative docker-compose.yml definitions',
            'Define service dependencies, restart policies, and port mappings',
            'Manage multi-service lifecycles with docker compose up, down, and logs',
            'Differentiate build contexts from pre-built registry images'
          ],
          introduction: `Managing multiple containers via individual CLI commands quickly becomes unmaintainable in production.

Docker Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application’s services, networks, and volumes. Then, with a single command (\`docker compose up -d\`), you create and start all the services from your configuration.`,
          deepDiveSections: [
            {
              title: 'Compose File Structure & Service Orchestration',
              explanation: `A standard docker-compose.yml contains three top-level keys:
1. services: Defines each container workload (e.g. web, api, db, redis).
2. networks: Declares custom isolated networks shared between services.
3. volumes: Defines named persistent storage volumes managed outside container lifecycles.

Compose automatically creates a dedicated default bridge network named \`<project_name>_default\` and registers every service name in DNS.`,
              keyPoint: 'Docker Compose automatically handles network creation and DNS discovery for all declared services.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Docker CLI vs. Docker Compose',
            headers: ['Aspect', 'Docker CLI (Manual)', 'Docker Compose (Declarative)'],
            rows: [
              ['Configuration', 'Imperative terminal commands', 'Version-controlled docker-compose.yml file'],
              ['Multi-Service Startup', 'Multiple sequential docker run commands', 'Single `docker compose up -d` command'],
              ['Teardown', 'Manual stop and rm per container', 'Clean `docker compose down -v` cleanup'],
              ['Environment Management', 'Pass -e flag repeatedly', 'Centralized .env file integration']
            ]
          },
          coreConcepts: [
            'Declarative service specification in YAML format',
            'Service orchestration with `depends_on` and health checks',
            'One-command environment startup and teardown'
          ],
          syntax: `# Common Docker Compose Commands
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker compose down -v`,
          codeExamples: [
            {
              language: 'yaml',
              code: `version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://db:27017/zenscore
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mongo:7-jammy
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: always

volumes:
  mongo_data:`,
              explanation: 'Standard multi-service Compose configuration linking an Express API to a MongoDB database.'
            }
          ],
          commonMistakes: [
            'Assuming depends_on waits for the database to be fully ready (it only waits for container start; use healthchecks for readiness)',
            'Committing sensitive credentials inside docker-compose.yml instead of referencing .env files'
          ],
          bestPractices: [
            'Always use named volumes for database persistence in Compose files',
            'Use depends_on with condition: service_healthy for dependable startup order'
          ],
          summary: `Docker Compose simplifies multi-container development by providing declarative, reproducible environment orchestration in a single YAML file.`,
          resources: [
            { title: 'Docker Compose Official Specification', url: 'https://docs.docker.com/compose/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }
          ],
          assessment: {
            questions: [
              {
                id: 'd4_q1',
                question: 'How do services declared inside the same docker-compose.yml communicate with each other over the network?',
                options: [
                  'Using the service name as the hostname (e.g. http://db:27017)',
                  'Using the host computer IP address 127.0.0.1',
                  'By opening public SSH tunnels between containers',
                  'Services cannot communicate in Docker Compose'
                ],
                correctIndex: 0,
                topic: 'Compose Service Discovery',
                explanation: 'Docker Compose creates a shared network and assigns DNS aliases matching each service name.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a Production Docker Compose Stack',
            difficulty: 'Intermediate',
            problemStatement: 'Write a valid `docker-compose.yml` defining a `web` service built from `./` mapped to port `80:80` and a `redis` service using image `redis:alpine` with volume `cache_data` mounted to `/data`.',
            instructions: 'Declare both services and the top-level named volume.',
            requirements: [
              'services block containing web and redis',
              'web: build context . and ports 80:80',
              'redis: image redis:alpine and volume cache_data:/data',
              'top-level volumes: cache_data'
            ],
            starterCode: `version: '3.8'\nservices:\n  web:\n`,
            solutionCode: `version: '3.8'\nservices:\n  web:\n    build: .\n    ports:\n      - "80:80"\n  redis:\n    image: redis:alpine\n    volumes:\n      - cache_data:/data\nvolumes:\n  cache_data:`,
            hints: ['Include version, services, web, redis, and volumes keys.']
          }
        },
        {
          lessonNumber: 5,
          title: 'Multi-Container Application Architecture',
          description: 'Design robust 3-tier architectures (Frontend, Backend API, Database & Cache) with isolated subnets and reverse proxies.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Architect decoupled N-tier application stacks in Docker',
            'Configure Nginx as a reverse proxy routing to backend containers',
            'Isolate internal databases on private non-routable networks'
          ],
          introduction: `In production systems, microservices should not all share a single flat network. Front-facing web services should be exposed to the internet, while databases and internal caches must remain completely isolated on internal subnets.`,
          deepDiveSections: [
            {
              title: '3-Tier Network Segmentation',
              explanation: `A secure 3-tier architecture utilizes two separate bridge networks:
1. frontend-net: Connects the Nginx reverse proxy and client applications.
2. backend-net: Connects the API backend to internal PostgreSQL and Redis instances.
The API container joins BOTH networks to act as a secure gateway, preventing direct external access to databases.`,
              keyPoint: 'Network segmentation prevents database compromise even if a frontend container is breached.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Flat vs. Segmented Network Architecture',
            headers: ['Criteria', 'Flat Single Network', 'Segmented Multi-Network'],
            rows: [
              ['Security', 'Low (Database exposed to all containers)', 'High (Database isolated to backend only)'],
              ['Blast Radius', 'Large if any container is compromised', 'Contained to specific network subnet'],
              ['Traffic Control', 'Unrestricted inter-service pinging', 'Explicit whitelist per service attachment']
            ]
          },
          coreConcepts: ['3-tier network topology', 'Reverse proxy routing with Nginx', 'Database subnet isolation'],
          syntax: `# Inspecting container networks
docker inspect <container-id> --format '{{json .NetworkSettings.Networks}}'`,
          codeExamples: [
            {
              language: 'yaml',
              code: `services:
  proxy:
    image: nginx:alpine
    ports: ["80:80"]
    networks: [frontend-net]
  api:
    build: ./api
    networks: [frontend-net, backend-net]
  db:
    image: postgres:16
    networks: [backend-net]
networks:
  frontend-net:
  backend-net:`,
              explanation: 'Segmented 3-tier network configuration.'
            }
          ],
          commonMistakes: ['Exposing internal database ports to 0.0.0.0 in production compose files'],
          bestPractices: ['Only map ports on the reverse proxy; let all other services communicate internally over private networks'],
          summary: `Segmenting networks into frontend and backend subnets enforces least-privilege security across multi-container architectures.`,
          resources: [{ title: 'Docker Security Best Practices', url: 'https://docs.docker.com/engine/security/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd5_q1',
                question: 'Why should database containers NOT expose ports on the host machine in a multi-container stack with a reverse proxy?',
                options: [
                  'To prevent direct unauthorized access from the public internet',
                  'Because databases run slower when ports are mapped',
                  'Because Docker cannot bind ports for databases',
                  'To reduce image size'
                ],
                correctIndex: 0,
                topic: 'Database Network Security',
                explanation: 'Backend services communicate internally via Docker DNS; exposing database ports to the host creates unnecessary security vulnerabilities.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure a Multi-Network Topology',
            difficulty: 'Intermediate',
            problemStatement: 'Write a compose network configuration connecting `api` to both `frontend_net` and `backend_net`, while `db` is connected only to `backend_net`.',
            instructions: 'Define the services and networks blocks.',
            requirements: ['api on frontend_net and backend_net', 'db on backend_net only'],
            starterCode: `services:\n  api:\n    networks:\n`,
            solutionCode: `services:\n  api:\n    networks:\n      - frontend_net\n      - backend_net\n  db:\n    networks:\n      - backend_net\nnetworks:\n  frontend_net:\n  backend_net:`,
            hints: ['List both networks under api and only backend_net under db.']
          }
        },
        {
          lessonNumber: 6,
          title: 'Environment Variables, Volumes & Configuration',
          description: 'Manage 12-factor application configurations, .env file interpolation, and volume permissions across environments.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Implement 12-factor config management using .env files',
            'Handle environment variable precedence in Docker Compose',
            'Manage persistent bind mounts vs named volumes'
          ],
          introduction: `Hardcoding configuration values inside container images violates the 12-Factor App methodology. Docker Compose allows dynamic variable interpolation from .env files, enabling the same image to run seamlessly in development, staging, and production.`,
          deepDiveSections: [
            {
              title: 'Variable Precedence in Docker Compose',
              explanation: `Docker resolves environment variables in strict order of precedence:
1. Variables set on the CLI via \`docker compose run -e VAR=val\`.
2. Variables defined in the \`environment\` section of docker-compose.yml.
3. Variables passed via the \`env_file\` directive.
4. Variables in the root \`.env\` file in the compose directory.
5. Default values specified in compose syntax: \`\${PORT:-5000}\`.`,
              keyPoint: 'CLI flags override compose.yml values, which in turn override .env file defaults.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: environment vs env_file in Compose',
            headers: ['Feature', 'environment block', 'env_file block'],
            rows: [
              ['Definition', 'Explicit key-value pairs in YAML', 'Path to external .env file'],
              ['Version Control', 'Committed with compose file', 'Excluded via .gitignore'],
              ['Best For', 'Static service parameters', 'Secrets, tokens, and DB passwords']
            ]
          },
          coreConcepts: ['12-factor configuration separation', 'Variable interpolation syntax (`${VAR}`)', 'Secrets isolation'],
          syntax: `# Variable interpolation in Compose
services:
  app:
    image: my-app:\${APP_VERSION:-latest}
    env_file:
      - .env.production`,
          codeExamples: [
            {
              language: 'yaml',
              code: `services:
  web:
    image: node:20-alpine
    environment:
      NODE_ENV: production
      PORT: \${PORT:-3000}
      DB_PASSWORD: \${DB_PASS:?Database password is required!}`,
              explanation: 'Mandatory variable syntax (?error) ensuring compose fails if DB_PASS is missing.'
            }
          ],
          commonMistakes: ['Committing production .env files with live database credentials into Git repositories'],
          bestPractices: ['Provide a .env.example template and inject live values via CI/CD secrets managers'],
          summary: `Environment variable interpolation enables clean separation between container code and environment-specific configuration.`,
          resources: [{ title: 'Docker Environment Variables Guide', url: 'https://docs.docker.com/compose/environment-variables/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd6_q1',
                question: 'What is the function of the syntax `${PORT:-8080}` in a docker-compose.yml file?',
                options: [
                  'Uses the value of PORT from the environment, or defaults to 8080 if unset',
                  'Throws an error if PORT is 8080',
                  'Subtracts 8080 from the PORT variable',
                  'Binds all ports between PORT and 8080'
                ],
                correctIndex: 0,
                topic: 'Compose Variable Defaults',
                explanation: 'The `:-` operator provides a fallback default value if the environment variable is not defined.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement .env File Integration',
            difficulty: 'Beginner',
            problemStatement: 'Write a compose service snippet for `api` using `env_file: .env` and setting `PORT: ${API_PORT:-5000}`.',
            instructions: 'Use the env_file and environment keys.',
            requirements: ['env_file pointing to .env', 'environment setting PORT default 5000'],
            starterCode: `services:\n  api:\n    image: node:20\n`,
            solutionCode: `services:\n  api:\n    image: node:20\n    env_file:\n      - .env\n    environment:\n      - PORT=\${API_PORT:-5000}`,
            hints: ['Use env_file array and environment array with :- default operator.']
          }
        }
      ]
    },
    {
      title: 'Phase 3: Storage, Networking & Production Containers',
      order: 3,
      lessons: [
        {
          lessonNumber: 7,
          title: 'Docker Volumes & Persistent Storage',
          description: 'Master Docker storage drivers, named volumes, bind mounts, tmpfs in-memory storage, and volume backup workflows.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Differentiate Named Volumes, Bind Mounts, and tmpfs mounts',
            'Understand Copy-on-Write (CoW) and the overlay2 storage driver',
            'Implement volume backup, restoration, and migration procedures'
          ],
          introduction: `Containers are inherently ephemeral. When a container is deleted, any data written to its writable layer is permanently lost. Docker Volumes decouple persistent application data from the container lifecycle, storing files safely on the host filesystem.`,
          deepDiveSections: [
            {
              title: 'Storage Mount Types & Mechanics',
              explanation: `Docker supports three primary mount types:
1. Named Volumes: Managed completely by Docker in \`/var/lib/docker/volumes/\`. Best for production databases (PostgreSQL, MongoDB) with automated permissions and high I/O performance.
2. Bind Mounts: Mounts an arbitrary host folder directly into the container. Best for local development live-reloading (\`./src:/app/src\`).
3. tmpfs Mounts: Stores files strictly in host system memory without ever writing to disk. Best for temporary sensitive secrets and session tokens.`,
              keyPoint: 'Named volumes are managed by Docker for production persistence; bind mounts link host development directories.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Named Volumes vs. Bind Mounts vs. tmpfs',
            headers: ['Feature', 'Named Volume', 'Bind Mount', 'tmpfs Mount'],
            rows: [
              ['Host Location', '/var/lib/docker/volumes/ (Docker managed)', 'Any custom host folder (e.g. ~/my-app)', 'Host RAM only (Never on disk)'],
              ['Performance', 'Optimized for high database I/O', 'Subject to host OS filesystem sync', 'Fastest (Memory speed)'],
              ['Lifecycle', 'Persists independently of containers', 'Persists on host filesystem', 'Erased on container shutdown'],
              ['Best Use Case', 'Production Databases & Uploads', 'Local code live-reloading', 'Secrets, tokens & temporary cache']
            ]
          },
          coreConcepts: ['Data persistence independent of container destruction', 'Volume backup via tar pipelines', 'tmpfs memory isolation'],
          syntax: `# Docker Volume Management
docker volume create db_data
docker volume ls
docker volume inspect db_data
docker run -v db_data:/var/lib/postgresql/data postgres
docker volume rm db_data`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Backup a named volume to a host tarball
docker run --rm \\
  -v db_data:/volume \\
  -v $(pwd):/backup \\
  alpine tar -czvf /backup/db_backup.tar.gz -C /volume .`,
              explanation: 'Spawns a temporary container to archive a named volume into a host tar file.'
            }
          ],
          commonMistakes: ['Relying on bind mounts in production environments across different host operating systems'],
          bestPractices: ['Always use named volumes for database storage and automate daily volume snapshots'],
          summary: `Named volumes provide isolated, high-performance persistent storage that survives container upgrades, restarts, and removals.`,
          resources: [{ title: 'Docker Storage Overview', url: 'https://docs.docker.com/storage/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd7_q1',
                question: 'Which Docker mount type stores data exclusively in host RAM without writing anything to the disk?',
                options: ['tmpfs mount', 'Named volume', 'Bind mount', 'Overlay2 layer'],
                correctIndex: 0,
                topic: 'tmpfs Storage',
                explanation: 'tmpfs mounts store data strictly in host system memory, making them ideal for sensitive credentials and high-speed temporary storage.'
              }
            ]
          },
          practicalTask: {
            title: 'Create & Mount a Named Volume',
            difficulty: 'Beginner',
            problemStatement: 'Write the command to create a named volume called `app_data` and attach it to an `nginx:alpine` container at `/usr/share/nginx/html`.',
            instructions: 'Create the volume first, then run the container with -v.',
            requirements: ['docker volume create app_data', 'docker run -d -v app_data:/usr/share/nginx/html nginx:alpine'],
            starterCode: `docker volume create \ndocker run `,
            solutionCode: `docker volume create app_data\ndocker run -d --name web -v app_data:/usr/share/nginx/html nginx:alpine`,
            hints: ['Use docker volume create app_data and docker run with -v app_data:<target>.']
          }
        },
        {
          lessonNumber: 8,
          title: 'Docker Networks & Service Discovery',
          description: 'Configure advanced network topologies, custom subnets, IPAM drivers, and cross-container load balancing.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Configure custom subnets and gateway ranges with IPAM',
            'Implement multi-tier network topologies in Docker Compose',
            'Debug network connectivity using ping, netcat, and curl inside containers'
          ],
          introduction: `As microservice stacks scale, network isolation and automated discovery become critical. Docker network IPAM allows assigning custom IP subnets and gateway ranges while maintaining automatic DNS resolution across services.`,
          deepDiveSections: [
            {
              title: 'IP Address Management (IPAM) & Subnets',
              explanation: `Docker allows explicit definition of IP CIDR blocks:
• Subnet: e.g. \`10.0.1.0/24\` (allocates 254 container IPs).
• Gateway: e.g. \`10.0.1.1\` (the bridge virtual interface on the host).
This prevents IP collisions with corporate VPNs and internal enterprise subnets.`,
              keyPoint: 'Custom IPAM configurations prevent subnet collisions with host enterprise networks.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Dynamic IP vs. Static IP in Docker',
            headers: ['Aspect', 'Dynamic IP (Recommended)', 'Static IP'],
            rows: [
              ['Discovery', 'Via internal DNS service names', 'Via hardcoded IP addresses'],
              ['Maintainability', 'Zero maintenance on container recreation', 'Requires manual IP bookkeeping'],
              ['Flexibility', 'Scales across clusters seamlessly', 'Prone to IP conflicts on restarts']
            ]
          },
          coreConcepts: ['CIDR subnet allocation with IPAM', 'Embedded DNS lookup protocols', 'Network troubleshooting tools'],
          syntax: `# Custom Subnet Network Creation
docker network create \\
  --driver bridge \\
  --subnet 192.168.100.0/24 \\
  --gateway 192.168.100.1 \\
  secure-network`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Test network connectivity from inside a container
docker exec -it api-service ping -c 3 database-service
docker exec -it api-service nc -zv database-service 5432`,
              explanation: 'Verifies internal DNS name resolution and TCP port connectivity between services.'
            }
          ],
          commonMistakes: ['Hardcoding container IP addresses in application config files instead of DNS hostnames'],
          bestPractices: ['Always use service names in connection strings and diagnose connectivity with netcat (nc)'],
          summary: `Robust network architecture leverages Docker embedded DNS and segmented IPAM subnets to secure microservice communication.`,
          resources: [{ title: 'Docker Network Drivers', url: 'https://docs.docker.com/network/drivers/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd8_q1',
                question: 'What is the IP address of Docker’s embedded DNS resolver inside a user-defined network?',
                options: ['127.0.0.11', '8.8.8.8', '192.168.1.1', '10.0.0.1'],
                correctIndex: 0,
                topic: 'Docker Embedded DNS',
                explanation: 'Docker runs an internal DNS service at 127.0.0.11 inside containers attached to user-defined networks.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Custom Subnet Network in Compose',
            difficulty: 'Intermediate',
            problemStatement: 'Write a compose networks block defining `custom_net` with bridge driver and IPAM subnet `172.28.0.0/16`.',
            instructions: 'Use the ipam and config keys under the network definition.',
            requirements: ['driver: bridge', 'ipam config with subnet: 172.28.0.0/16'],
            starterCode: `networks:\n  custom_net:\n    driver: bridge\n    ipam:\n`,
            solutionCode: `networks:\n  custom_net:\n    driver: bridge\n    ipam:\n      config:\n        - subnet: 172.28.0.0/16`,
            hints: ['Under ipam, use config: - subnet: 172.28.0.0/16.']
          }
        },
        {
          lessonNumber: 9,
          title: 'Container Health Checks & Resource Management',
          description: 'Configure HEALTHCHECK instructions, restart policies, and cgroup hardware constraints (CPU cores, memory limits).',
          estimatedMinutes: 35,
          learningObjectives: [
            'Write robust HEALTHCHECK instructions in Dockerfiles and Compose',
            'Configure CPU limits (--cpus) and Memory caps (--memory) to prevent noisy neighbor problems',
            'Integrate restart policies (unless-stopped, on-failure:5)'
          ],
          introduction: `A container whose main process is running may still be deadlocked, unresponsive, or returning HTTP 500 errors. Docker Healthchecks allow the engine to probe application status and alert orchestrators when a container is unhealthy.`,
          deepDiveSections: [
            {
              title: 'Healthcheck Lifecycle & Parameters',
              explanation: `A Docker healthcheck executes a command inside the container at periodic intervals:
• --interval: Frequency of check (e.g. 30s).
• --timeout: Maximum wait time for check command (e.g. 5s).
• --retries: Consecutive failures required to mark container \`unhealthy\` (e.g. 3).
• --start-period: Initialization grace period during bootstrap (e.g. 10s).`,
              keyPoint: 'Healthchecks verify actual application responsiveness rather than just process PID existence.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Process Status vs. Container Healthcheck',
            headers: ['Scenario', 'Standard Docker Status', 'With HEALTHCHECK Enabled'],
            rows: [
              ['App Deadlocked / Frozen', 'Status: Up (Process alive)', 'Status: Up (unhealthy) — Triggers restart/alert'],
              ['Database Connection Dropped', 'Status: Up', 'Status: Up (unhealthy) — Removed from load balancer'],
              ['Initial Database Migration', 'Status: Up (Prematurely)', 'Status: Starting (Respects start-period grace period)']
            ]
          },
          coreConcepts: ['HEALTHCHECK curl/wget probes', 'CPU quota limits (--cpus=1.5)', 'Memory cap limits (--memory=512m)'],
          syntax: `# Dockerfile HEALTHCHECK Syntax
HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Resource constrained run command
docker run -d --name limited-api --memory=512m --cpus=1.5 my-api`,
          codeExamples: [
            {
              language: 'yaml',
              code: `services:
  api:
    image: my-node-api
    deploy:
      resources:
        limits:
          cpus: '1.50'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s`,
              explanation: 'Production healthcheck and resource limits in Docker Compose.'
            }
          ],
          commonMistakes: ['Omitting memory limits, allowing a memory leak in one container to freeze the entire host server'],
          bestPractices: ['Always define /health endpoints in backend APIs and attach curl-based Docker healthchecks'],
          summary: `Healthchecks and cgroup resource limits guarantee self-healing reliability and prevent resource starvation in production.`,
          resources: [{ title: 'Docker Healthcheck Reference', url: 'https://docs.docker.com/engine/reference/builder/#healthcheck', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd9_q1',
                question: 'What exit code must a HEALTHCHECK command return to indicate that the container is healthy?',
                options: ['0 (Success)', '1 (Error)', '200 (HTTP OK)', '-1 (Neutral)'],
                correctIndex: 0,
                topic: 'Healthcheck Exit Codes',
                explanation: 'In Linux shell conventions, exit code 0 indicates success (healthy), while exit code 1 indicates failure (unhealthy).'
              }
            ]
          },
          practicalTask: {
            title: 'Add a Healthcheck to a Dockerfile',
            difficulty: 'Intermediate',
            problemStatement: 'Write the complete `HEALTHCHECK` directive that checks `http://localhost:8080/health` using `curl -f` with a 30s interval, 5s timeout, and 3 retries.',
            instructions: 'Use the flags --interval, --timeout, --retries, and CMD.',
            requirements: ['--interval=30s', '--timeout=5s', '--retries=3', 'CMD curl -f http://localhost:8080/health || exit 1'],
            starterCode: `HEALTHCHECK --interval=30s `,
            solutionCode: `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:8080/health || exit 1`,
            hints: ['Format: HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:8080/health || exit 1']
          }
        }
      ]
    },
    {
      title: 'Phase 4: Docker Security & Optimization',
      order: 4,
      lessons: [
        {
          lessonNumber: 10,
          title: 'Container Security & Non-Root Containers',
          description: 'Harden container security, prevent root privilege escalation, drop Linux capabilities, and implement read-only root filesystems.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand root container vulnerability and namespace breakout risks',
            'Configure explicit non-root users (USER UID:GID)',
            'Drop unnecessary Linux capabilities using --cap-drop=ALL',
            'Run containers with read-only root filesystems (--read-only)'
          ],
          introduction: `By default, processes inside a Docker container run as \`root\` (UID 0). If a security vulnerability allows an attacker to break out of the container, they inherit full root control over the host operating system. Hardening containers with non-root users and dropped capabilities neutralizes this attack vector.`,
          deepDiveSections: [
            {
              title: 'Principle of Least Privilege in Container Security',
              explanation: `To achieve enterprise container security:
1. Create a dedicated unprivileged user: \`RUN addgroup -S appgroup && adduser -S appuser -G appgroup\`.
2. Switch execution context: \`USER appuser\`.
3. Drop all Linux kernel capabilities: \`--cap-drop=ALL --cap-add=NET_BIND_SERVICE\`.
4. Enforce read-only root filesystem: \`--read-only --tmpfs /tmp\`.`,
              keyPoint: 'Never run production containers as root; drop Linux capabilities and enforce non-root execution.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Default Root vs. Hardened Non-Root Container',
            headers: ['Security Dimension', 'Default Root Container', 'Hardened Non-Root Container'],
            rows: [
              ['Process User', 'root (UID 0)', 'appuser (UID 10001)'],
              ['Host Breakout Risk', 'Critical (Full host root access)', 'Low (Unprivileged user permissions)'],
              ['Filesystem Permissions', 'Full read-write access to container OS', 'Read-only root filesystem with tmpfs /tmp'],
              ['Linux Capabilities', 'Full default capability set enabled', 'All dropped except required capabilities']
            ]
          },
          coreConcepts: ['Non-root UID execution', 'Capability dropping (`--cap-drop`)', 'Read-only container root filesystems'],
          syntax: `# Hardened docker run execution
docker run -d \\
  --name secure-app \\
  --user 10001:10001 \\
  --cap-drop=ALL \\
  --cap-add=NET_BIND_SERVICE \\
  --read-only \\
  --tmpfs /tmp \\
  -p 8080:8080 \\
  my-secure-app:latest`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Create non-root system group & user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]`,
              explanation: 'Production Dockerfile creating and switching to unprivileged appuser.'
            }
          ],
          commonMistakes: ['Installing packages via apk or apt-get AFTER switching to non-root USER directive'],
          bestPractices: ['Always switch to USER after running privileged build commands and package installations'],
          summary: `Hardening containers by running as non-root users with dropped capabilities is mandatory for production compliance.`,
          resources: [{ title: 'Docker Security Guide', url: 'https://docs.docker.com/engine/security/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd10_q1',
                question: 'Why is it critical to run containers with an unprivileged non-root user in production?',
                options: [
                  'To prevent attackers from gaining root access to the host server if a container breakout occurs',
                  'Because root containers cannot connect to the internet',
                  'To bypass Docker daemon licensing',
                  'Because non-root containers take 0 bytes of RAM'
                ],
                correctIndex: 0,
                topic: 'Non-Root Container Security',
                explanation: 'If a vulnerability allows container escape, a non-root process only has unprivileged access on the host, preventing hostile takeover.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Non-Root Execution in a Dockerfile',
            difficulty: 'Intermediate',
            problemStatement: 'Write the Dockerfile instructions to create an unprivileged system group `node_group`, create user `node_user` inside that group, and switch to `node_user`.',
            instructions: 'Use addgroup -S, adduser -S, and the USER instruction.',
            requirements: ['addgroup -S node_group', 'adduser -S node_user -G node_group', 'USER node_user'],
            starterCode: `RUN addgroup -S node_group && \\\n`,
            solutionCode: `RUN addgroup -S node_group && adduser -S node_user -G node_group\nUSER node_user`,
            hints: ['RUN addgroup -S <group> && adduser -S <user> -G <group> followed by USER <user>.']
          }
        },
        {
          lessonNumber: 11,
          title: 'Image Optimization & Build Cache',
          description: 'Techniques to reduce Docker image size from gigabytes to megabytes using Alpine, Distroless, and BuildKit cache mounts.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Compare Alpine, Debian-slim, and Google Distroless base images',
            'Leverage Docker BuildKit cache mounts (`--mount=type=cache`)',
            'Analyze image layer footprints using `docker history` and Dive'
          ],
          introduction: `Bloated Docker images increase CI/CD deployment times, consume massive storage, and introduce security vulnerabilities. Image optimization strips unnecessary binaries, package managers, and caches to produce razor-thin images.`,
          deepDiveSections: [
            {
              title: 'Base Image Selection & Trade-Offs',
              explanation: `Choosing the right base image:
1. Ubuntu/Debian (800MB+): Full Linux userland; contains bash, curl, package managers, and build tools.
2. Alpine Linux (~5MB): Lightweight base using musl libc and busybox.
3. Google Distroless (~20MB): Contains ONLY application runtime binaries (e.g. node or python) without any shell, package manager, or standard utilities.`,
              keyPoint: 'Distroless images provide maximum security because they do not contain a shell (sh/bash) for attackers to exploit.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Base Image Footprints',
            headers: ['Image Type', 'Base Size', 'Shell Included', 'Vulnerability Risk'],
            rows: [
              ['node:20 (Debian)', '1.1 GB', 'Yes (/bin/bash, /bin/sh)', 'High (Full OS toolset included)'],
              ['node:20-alpine', '135 MB', 'Yes (/bin/sh via busybox)', 'Low (Minimal userland)'],
              ['gcr.io/distroless/nodejs20', '52 MB', 'No (Zero shell access)', 'Lowest (Minimal attack surface)']
            ]
          },
          coreConcepts: ['Distroless container execution', 'BuildKit cache mounting', 'Layer auditing with `docker history`'],
          syntax: `# Enable BuildKit and inspect image layer sizes
DOCKER_BUILDKIT=1 docker build -t my-app:optimized .
docker history my-app:optimized`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `# Ultra-fast npm caching with BuildKit
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \\
    npm ci
COPY . .
RUN npm run build`,
              explanation: 'Uses BuildKit cache mount to preserve npm cache across builds without baking it into the image layer.'
            }
          ],
          commonMistakes: ['Leaving package manager caches (e.g. /var/cache/apk/*) inside final image layers'],
          bestPractices: ['Always use `npm cache clean --force` or `--no-cache` flag when installing packages in Alpine'],
          summary: `Combining minimal base images with BuildKit cache mounts produces sub-60MB production images with lightning-fast build speeds.`,
          resources: [{ title: 'Docker BuildKit Guide', url: 'https://docs.docker.com/build/buildkit/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd11_q1',
                question: 'What is the primary security advantage of using Google Distroless container images?',
                options: [
                  'They do not include a package manager or shell (/bin/sh), preventing attackers from spawning interactive terminals',
                  'They run on quantum processors',
                  'They automatically bypass firewalls',
                  'They compress memory with gzip'
                ],
                correctIndex: 0,
                topic: 'Distroless Security',
                explanation: 'Distroless images contain only the application and runtime dependencies, omitting shells and package managers entirely.'
              }
            ]
          },
          practicalTask: {
            title: 'Optimize an Alpine Package Installation',
            difficulty: 'Beginner',
            problemStatement: 'Write a single `RUN` instruction in Alpine that installs `curl` without caching index files to disk.',
            instructions: 'Use apk add with --no-cache.',
            requirements: ['RUN apk add --no-cache curl'],
            starterCode: `RUN apk add `,
            solutionCode: `RUN apk add --no-cache curl`,
            hints: ['Use RUN apk add --no-cache curl.']
          }
        },
        {
          lessonNumber: 12,
          title: 'Dockerfile Security & Vulnerability Management',
          description: 'Scan container images for CVE vulnerabilities with Trivy and Docker Scout, manage secrets safely, and enforce OCI image signing.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Scan Docker images using Docker Scout and Trivy CLI',
            'Prevent secrets leakage in image layers using BuildKit secret mounts',
            'Enforce image immutability via content digest pinning (image@sha256:...)'
          ],
          introduction: `Container security vulnerabilities are frequently introduced through outdated base images and leaked build secrets. Scanning container images for Common Vulnerabilities and Exposures (CVEs) in CI/CD pipelines ensures that vulnerable dependencies never reach production.`,
          deepDiveSections: [
            {
              title: 'BuildKit Secret Mounts vs. ARG Variables',
              explanation: `Never pass sensitive credentials (GitHub tokens, private keys) via build \`ARG\` or \`ENV\` because they are permanently recorded in the image metadata.
Instead, use BuildKit secret mounts:
\`RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci\`
Docker mounts the secret in-memory during execution and guarantees it is never written to any image layer.`,
              keyPoint: 'BuildKit secret mounts allow access to private tokens during build without saving them into image layers.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: ARG vs. BuildKit Secret Mounts',
            headers: ['Method', 'Leaked in `docker history`', 'Stored in Layer', 'Security Rating'],
            rows: [
              ['ARG / ENV', 'Yes (Visible in plaintext)', 'Yes', 'Dangerous / Insecure'],
              ['BuildKit Secret Mount', 'No (Omitted from history)', 'No (In-memory only)', 'Enterprise Production Grade']
            ]
          },
          coreConcepts: ['Automated CVE scanning with Trivy', 'BuildKit `--mount=type=secret`', 'Digest pinning (`sha256`)'],
          syntax: `# Scanning an image for high/critical vulnerabilities with Trivy
trivy image --severity HIGH,CRITICAL my-app:latest
docker scout cves my-app:latest`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `# Digest-pinned base image for immutability
FROM node:20.11.1-alpine3.19@sha256:c2017eb5176... AS runner
WORKDIR /app
# Build with secret without leaking to layers
RUN --mount=type=secret,id=github_token \\
    GITHUB_TOKEN=$(cat /run/secrets/github_token) npm install @company/private-pkg`,
              explanation: 'Immutable digest pinning and secret mounting.'
            }
          ],
          commonMistakes: ['Using the `latest` tag in production instead of immutable digest SHA hashes'],
          bestPractices: ['Integrate automated Trivy scans into GitHub Actions to break builds on critical CVEs'],
          summary: `Continuous vulnerability scanning and BuildKit secret mounting safeguard production container supply chains.`,
          resources: [{ title: 'Trivy Vulnerability Scanner', url: 'https://aquasecurity.github.io/trivy/', provider: 'Aqua Security', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd12_q1',
                question: 'Why should build secrets NOT be passed using Dockerfile `ARG` variables?',
                options: [
                  'Because ARG values are stored in the image layer history and can be viewed with `docker history`',
                  'Because ARG variables only support integers',
                  'Because ARG variables expire after 10 seconds',
                  'Because Docker cannot parse strings in ARG'
                ],
                correctIndex: 0,
                topic: 'Build Secrets Leakage',
                explanation: 'Values passed to `ARG` are preserved in image metadata, allowing anyone with pull access to extract secrets via `docker history`.'
              }
            ]
          },
          practicalTask: {
            title: 'Scan an Image with Trivy',
            difficulty: 'Beginner',
            problemStatement: 'Write the Trivy command to scan image `web-app:1.0` filtering only for `CRITICAL` severity issues.',
            instructions: 'Use trivy image with --severity CRITICAL.',
            requirements: ['trivy image --severity CRITICAL web-app:1.0'],
            starterCode: `trivy image `,
            solutionCode: `trivy image --severity CRITICAL web-app:1.0`,
            hints: ['Syntax: trivy image --severity CRITICAL <image_name>']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Docker CI/CD & Registry',
      order: 5,
      lessons: [
        {
          lessonNumber: 13,
          title: 'Docker + GitHub Actions',
          description: 'Build automated continuous integration pipelines with GitHub Actions to test, build, and tag multi-arch Docker images.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Set up GitHub Actions Docker Buildx and Cache actions',
            'Implement GitHub Container Registry (ghcr.io) authentication',
            'Automate PR testing and image build validation'
          ],
          introduction: `Manually building and pushing Docker images from local machines leads to configuration drift and security risks. Continuous Integration pipelines in GitHub Actions automate building, testing, and pushing Docker images on every Git commit.`,
          deepDiveSections: [
            {
              title: 'GitHub Actions Docker Build Pipeline',
              explanation: `A standard production workflow utilizes official Docker actions:
1. \`docker/setup-buildx-action\`: Initializes the high-performance BuildKit engine.
2. \`docker/login-action\`: Authenticates securely against Docker Hub or GHCR.
3. \`docker/build-push-action\`: Builds the image with GitHub Actions layer caching (\`type=gha\`) and pushes to the registry.`,
              keyPoint: 'GitHub Actions cache backend (type=gha) speeds up cloud container builds by caching layers across pipeline runs.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Local Builds vs. CI/CD Pipeline Builds',
            headers: ['Attribute', 'Local Developer Build', 'GitHub Actions CI/CD Build'],
            rows: [
              ['Consistency', 'Varies based on local OS and architecture', 'Hermetic, reproducible Linux build runner'],
              ['Provenance', 'Unsigned, unverified origin', 'Cryptographically verified GitHub commit SHA tagging'],
              ['Speed', 'Subject to local CPU and network upload', 'High-speed cloud runners with distributed caching']
            ]
          },
          coreConcepts: ['Docker Buildx in CI/CD', 'GitHub Actions layer cache (`type=gha`)', 'Semantic versioning and SHA tagging'],
          syntax: `# GitHub Actions Docker workflow trigger
on:
  push:
    branches: [ main ]
    tags: [ 'v*.*.*' ]`,
          codeExamples: [
            {
              language: 'yaml',
              code: `name: Build & Push Docker Image
on:
  push:
    branches: [ main ]
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
              explanation: 'Complete GitHub Actions workflow with GHCR publishing and BuildKit caching.'
            }
          ],
          commonMistakes: ['Hardcoding Docker registry passwords in workflow YAML files instead of using GitHub Secrets'],
          bestPractices: ['Tag images with both the Git commit SHA and the semantic release version tag'],
          summary: `Automating Docker builds in GitHub Actions guarantees reproducible builds and fast deployment cycles.`,
          resources: [{ title: 'Docker GitHub Actions Guide', url: 'https://docs.docker.com/build/ci/github-actions/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd13_q1',
                question: 'What is the purpose of `cache-from: type=gha` in docker/build-push-action?',
                options: [
                  'Reuses cached Docker build layers directly from GitHub Actions storage to speed up builds',
                  'Compresses the Git repository into a zip file',
                  'Runs automated unit tests in parallel',
                  'Deletes old branches'
                ],
                correctIndex: 0,
                topic: 'CI/CD Build Caching',
                explanation: '`type=gha` leverages GitHub Actions internal cache storage, avoiding redundant layer rebuilds across CI runs.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a GitHub Actions Docker Login Step',
            difficulty: 'Intermediate',
            problemStatement: 'Write the YAML step to log into `ghcr.io` using `docker/login-action@v3` with `github.actor` and `secrets.GITHUB_TOKEN`.',
            instructions: 'Use the `uses` and `with` directives.',
            requirements: ['uses: docker/login-action@v3', 'registry: ghcr.io', 'username: ${{ github.actor }}', 'password: ${{ secrets.GITHUB_TOKEN }}'],
            starterCode: `- name: Login to GHCR\n  uses: docker/login-action@v3\n  with:\n`,
            solutionCode: `- name: Login to GHCR\n  uses: docker/login-action@v3\n  with:\n    registry: ghcr.io\n    username: \${{ github.actor }}\n    password: \${{ secrets.GITHUB_TOKEN }}`,
            hints: ['Specify registry, username, and password under with.']
          }
        },
        {
          lessonNumber: 14,
          title: 'Container Registries & Image Publishing',
          description: 'Authenticate, tag, version, and publish images to Docker Hub, Amazon ECR, and GitHub Packages (GHCR).',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand container registry distribution specifications (OCI standard)',
            'Tag images with semantic versions (v1.2.0), latest, and commit SHAs',
            'Manage private repository permissions and access tokens'
          ],
          introduction: `A Container Registry is a centralized catalog for storing, managing, and distributing Docker container images. Knowing how to authenticate, tag, and publish images ensures clean release management.`,
          deepDiveSections: [
            {
              title: 'Image Tagging Conventions & Semantics',
              explanation: `Image names follow the format \`[registry/][namespace/]repository:tag\`:
• \`ghcr.io/zenscore/api:v1.4.2\`: Explicit version release.
• \`ghcr.io/zenscore/api:sha-a8f3b9c\`: Immutable commit-specific build.
• \`ghcr.io/zenscore/api:latest\`: Pointer to the most recent build (mutable).`,
              keyPoint: 'Always deploy specific semantic versions or commit SHAs in production rather than mutable latest tags.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Docker Hub vs. Amazon ECR vs. GitHub Container Registry',
            headers: ['Registry', 'Hosting', 'Authentication Method', 'Best For'],
            rows: [
              ['Docker Hub', 'Public Cloud (Docker Inc.)', 'Personal Access Token', 'Open-source and public community images'],
              ['Amazon ECR', 'AWS Managed VPC', 'AWS IAM / AWS CLI token', 'Enterprise AWS ECS and EKS clusters'],
              ['GHCR (GitHub)', 'GitHub Cloud', 'GITHUB_TOKEN / PAT', 'Integrated GitHub repository CI/CD pipelines']
            ]
          },
          coreConcepts: ['OCI Registry Specification', 'Semantic image version tagging', 'Token authentication'],
          syntax: `# Docker Registry CLI commands
docker login ghcr.io -u USERNAME
docker tag local-image:latest ghcr.io/org/repo:1.0.0
docker push ghcr.io/org/repo:1.0.0
docker pull ghcr.io/org/repo:1.0.0`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Authenticate with GitHub Packages via Personal Access Token
echo $CR_PAT | docker login ghcr.io -u myusername --password-stdin

# Tag and push
docker tag my-api:latest ghcr.io/myorg/my-api:v2.1.0
docker push ghcr.io/myorg/my-api:v2.1.0`,
              explanation: 'Secure password-stdin login and tagged image publishing.'
            }
          ],
          commonMistakes: ['Deploying with :latest tag in Kubernetes, which causes silent caching bugs and rollback failures'],
          bestPractices: ['Pin deployments to specific version tags (v1.0.4) or SHA digests for deterministic rollouts'],
          summary: `Publishing versioned OCI container images to private registries establishes a secure, traceable deployment pipeline.`,
          resources: [{ title: 'GitHub Packages Container Registry', url: 'https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry', provider: 'GitHub', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd14_q1',
                question: 'Why should production deployments avoid using the `:latest` Docker image tag?',
                options: [
                  'Because :latest is mutable and can overwrite previous versions, making rollbacks unpredictable',
                  'Because :latest images take double the disk space',
                  'Because Docker deletes :latest images after 24 hours',
                  'Because :latest cannot be downloaded over HTTPS'
                ],
                correctIndex: 0,
                topic: 'Image Tagging Best Practices',
                explanation: 'The `:latest` tag changes on every push, making it impossible to know exactly which code version is running or rollback deterministically.'
              }
            ]
          },
          practicalTask: {
            title: 'Tag & Push an Image to a Registry',
            difficulty: 'Beginner',
            problemStatement: 'Write the commands to tag local image `app:prod` as `ghcr.io/zenscore/app:v1.0.0` and push it to the registry.',
            instructions: 'Use docker tag followed by docker push.',
            requirements: ['docker tag app:prod ghcr.io/zenscore/app:v1.0.0', 'docker push ghcr.io/zenscore/app:v1.0.0'],
            starterCode: `docker tag \ndocker push `,
            solutionCode: `docker tag app:prod ghcr.io/zenscore/app:v1.0.0\ndocker push ghcr.io/zenscore/app:v1.0.0`,
            hints: ['docker tag <source> <target> followed by docker push <target>.']
          }
        },
        {
          lessonNumber: 15,
          title: 'Automated Container Build & Deployment',
          description: 'Build continuous deployment pipelines using Watchtower, Docker Webhooks, and SSH remote deployment runners.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Set up zero-downtime rolling container updates',
            'Automate container redeployments using SSH deployment keys in CI/CD',
            'Implement Watchtower for automated base image patch updates'
          ],
          introduction: `Once images are published to a container registry, the deployment pipeline must automatically update the running containers on production host servers without manual SSH intervention or downtime.`,
          deepDiveSections: [
            {
              title: 'Remote SSH Automated Deployment Pattern',
              explanation: `The standard lightweight CD pattern:
1. CI pipeline authenticates to the production VPS via SSH Deploy Keys.
2. Pulls the latest versioned images: \`docker compose pull\`.
3. Performs a rolling zero-downtime recreation: \`docker compose up -d --remove-orphans\`.
4. Prunes stale dangling images: \`docker image prune -f\`.`,
              keyPoint: 'Docker compose up -d automatically recreates only containers whose images or configurations have changed.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Manual SSH vs. Automated CI/CD Deployments',
            headers: ['Criteria', 'Manual Deployment', 'Automated CI/CD CD Pipeline'],
            rows: [
              ['Deployment Speed', '10–30 minutes per release', 'Under 60 seconds completely automated'],
              ['Human Error Risk', 'High (Forgotten env vars, missed commands)', 'Zero (Declarative, scripted pipeline)'],
              ['Audit Log', 'None (Terminal history only)', 'Full history attached to Git commit and pipeline logs']
            ]
          },
          coreConcepts: ['Automated deployment runners', 'Zero-downtime compose recreation', 'Dangling image cleanup'],
          syntax: `# Remote deployment command sequence
ssh deploy_user@prod-server "cd /app && docker compose pull && docker compose up -d && docker image prune -f"`,
          codeExamples: [
            {
              language: 'yaml',
              code: `- name: Deploy to Production Server
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: \${{ secrets.PROD_HOST }}
    username: \${{ secrets.PROD_USER }}
    key: \${{ secrets.PROD_SSH_KEY }}
    script: |
      cd /opt/zenscore-stack
      docker compose pull api
      docker compose up -d --no-deps api
      docker system prune -af --volumes=false`,
              explanation: 'GitHub Actions SSH deployment step updating the API service without touching the database.'
            }
          ],
          commonMistakes: ['Running `docker system prune --volumes` in automated scripts, which deletes live database volumes!'],
          bestPractices: ['Never include `--volumes` flag in automated image prune scripts to prevent accidental data loss'],
          summary: `Continuous deployment pipelines eliminate manual operations, deploying new features safely in seconds.`,
          resources: [{ title: 'Docker Deployments in Production', url: 'https://docs.docker.com/engine/swarm/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd15_q1',
                question: 'What does `docker compose up -d --no-deps api` accomplish during a continuous deployment update?',
                options: [
                  'Recreates and updates only the `api` container without restarting its dependent database or cache services',
                  'Deletes all dependencies permanently',
                  'Disables the network interfaces',
                  'Runs the API in single-threaded mode'
                ],
                correctIndex: 0,
                topic: 'Zero-Downtime Compose Updates',
                explanation: '`--no-deps` prevents Docker Compose from restarting linked services (like PostgreSQL or Redis) when only updating the API service.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a Production Re-Deployment Script',
            difficulty: 'Intermediate',
            problemStatement: 'Write the 3 bash commands to pull the latest images defined in docker-compose.yml, recreate the containers in detached mode, and clean up dangling untagged images.',
            instructions: 'Combine docker compose pull, docker compose up -d, and docker image prune -f.',
            requirements: ['docker compose pull', 'docker compose up -d', 'docker image prune -f'],
            starterCode: `docker compose \ndocker compose \ndocker image `,
            solutionCode: `docker compose pull\ndocker compose up -d\ndocker image prune -f`,
            hints: ['1. docker compose pull, 2. docker compose up -d, 3. docker image prune -f']
          }
        }
      ]
    },
    {
      title: 'Phase 6: Production Docker',
      order: 6,
      lessons: [
        {
          lessonNumber: 16,
          title: 'Docker Logging & Monitoring',
          description: 'Configure JSON log rotation, Loki/Prometheus container monitoring, and cAdvisor resource metrics.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Configure Docker logging drivers (json-file, syslog, fluentd)',
            'Prevent host disk space exhaustion using max-size and max-file log rotation',
            'Export container metrics using cAdvisor and Prometheus'
          ],
          introduction: `Unbounded container logs can quickly consume gigabytes of host disk space, resulting in catastrophic disk full errors. Production Docker configurations enforce strict log rotation and ship logs to centralized monitoring stacks.`,
          deepDiveSections: [
            {
              title: 'Log Rotation & Storage Drivers',
              explanation: `By default, Docker stores stdout/stderr output indefinitely in JSON log files.
Configure log limits globally in \`/etc/docker/daemon.json\` or per service:
\`\`\`json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "5"
  }
}
\`\`\`
This caps container logs at 100MB total (5 files of 20MB each) with automatic circular rotation.`,
              keyPoint: 'Configuring max-size and max-file log rotation is essential to prevent host disk exhaustion.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Default Logging vs. Rotated JSON Logging',
            headers: ['Metric', 'Default Docker Logging', 'Production Rotated Logging'],
            rows: [
              ['Disk Space Usage', 'Uncapped (Grows until host disk is 100% full)', 'Strictly capped (e.g. 50MB max per container)'],
              ['Host Stability', 'Risk of server crash on runaway logging', 'Guaranteed host disk availability'],
              ['Log Shipping', 'Manual file tailing', 'Direct integration with Vector, Fluentd, or Loki']
            ]
          },
          coreConcepts: ['Circular log rotation (max-size/max-file)', 'Centralized log drivers', 'cAdvisor resource monitoring'],
          syntax: `# View real-time container logs with timestamps
docker logs -f --tail 200 --timestamps <container-id>`,
          codeExamples: [
            {
              language: 'yaml',
              code: `services:
  api:
    image: my-api:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"`,
              explanation: 'Limits container logs to 3 files of 10MB each in Docker Compose.'
            }
          ],
          commonMistakes: ['Leaving default logging without rotation on high-throughput microservices writing thousands of logs/sec'],
          bestPractices: ['Set global log rotation in /etc/docker/daemon.json across all server containers'],
          summary: `Configuring log rotation and monitoring telemetry ensures predictable, crash-resilient container hosting.`,
          resources: [{ title: 'Docker Logging Drivers', url: 'https://docs.docker.com/config/containers/logging/configure/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd16_q1',
                question: 'What happens if a Docker container generates millions of log lines without configuring log rotation?',
                options: [
                  'The JSON log file grows continuously until it exhausts all host disk space, crashing host services',
                  'Docker automatically deletes the container',
                  'Docker converts logs to zip files automatically',
                  'Logs are discarded after 24 hours'
                ],
                correctIndex: 0,
                topic: 'Log Rotation Protection',
                explanation: 'By default, Docker does not rotate logs, which can fill the host hard drive and cause system-wide failures.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Log Rotation in Compose',
            difficulty: 'Intermediate',
            problemStatement: 'Add a logging configuration to a service in `docker-compose.yml` with driver `json-file`, `max-size: "10m"`, and `max-file: "3"`.',
            instructions: 'Use the logging key with driver and options.',
            requirements: ['driver: "json-file"', 'options with max-size: "10m" and max-file: "3"'],
            starterCode: `services:\n  web:\n    image: nginx\n    logging:\n`,
            solutionCode: `services:\n  web:\n    image: nginx\n    logging:\n      driver: "json-file"\n      options:\n        max-size: "10m"\n        max-file: "3"`,
            hints: ['Under logging, define driver: "json-file" and options: max-size: "10m", max-file: "3".']
          }
        },
        {
          lessonNumber: 17,
          title: 'Docker Debugging & Troubleshooting',
          description: 'Diagnose crashed containers, exit codes (137 OOM, 139 Segfault), inspect network interfaces, and debug live containers.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Interpret Docker exit codes (Exit 137 = OOM Killed, Exit 1 = App Error)',
            'Debug stopped containers using docker logs, inspect, and commit-to-debug',
            'Inspect network namespaces and active sockets inside minimal containers'
          ],
          introduction: `When containers fail silently or crash on startup, developers need a systematic diagnostic workflow. Understanding exit codes, inspecting container metadata, and attaching debug shells enables rapid root-cause isolation.`,
          deepDiveSections: [
            {
              title: 'Standard Docker Container Exit Codes',
              explanation: `When a container terminates, its exit code indicates the root failure reason:
• Exit Code 0: Clean normal shutdown.
• Exit Code 1: Application exception / unhandled error.
• Exit Code 137 (128 + 9 SIGKILL): Killed by Linux OOM (Out Of Memory) killer or manual \`docker kill\`.
• Exit Code 139 (128 + 11 SIGSEGV): Segmentation fault in binary.
• Exit Code 143 (128 + 15 SIGTERM): Graceful termination request.`,
              keyPoint: 'Exit Code 137 is the universal signature of a container killed due to exceeding memory limits (OOM).'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Common Container Exit Codes & Root Causes',
            headers: ['Exit Code', 'Signal / Name', 'Typical Root Cause', 'Resolution'],
            rows: [
              ['1', 'General Error', 'Syntax error, missing env var, DB connection refused', 'Check `docker logs <id>` for stack trace'],
              ['137', 'SIGKILL (OOM)', 'Container exceeded memory cap (--memory)', 'Increase memory limit or fix memory leak in code'],
              ['143', 'SIGTERM', 'Normal graceful shutdown command received', 'Expected behavior during deployment restart'],
              ['127', 'Command Not Found', 'Entrypoint binary does not exist in container OS', 'Verify path in CMD or check Alpine package installs']
            ]
          },
          coreConcepts: ['Exit code diagnostic interpretation', 'Interactive debugging with `docker exec`', 'Container state inspection with `docker inspect`'],
          syntax: `# Diagnosing container failure reasons
docker inspect <container-id> --format '{{.State.ExitCode}} - {{.State.OOMKilled}}'
docker logs --tail 50 <container-id>`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Inspect why a container died
docker inspect crashed-app --format 'Status: {{.State.Status}} | ExitCode: {{.State.ExitCode}} | OOMKilled: {{.State.OOMKilled}}'

# If OOMKilled: true, increase memory allocation
docker run -d --name fixed-app --memory=1g my-app`,
              explanation: 'Diagnoses whether container failure was caused by Linux OOM memory exhaustion.'
            }
          ],
          commonMistakes: ['Assuming Exit Code 137 is an application code crash rather than a memory quota limit breach'],
          bestPractices: ['Always inspect `.State.OOMKilled` when investigating random container restarts'],
          summary: `Systematic diagnostic workflows using exit codes and metadata inspection resolve container incidents quickly.`,
          resources: [{ title: 'Docker Debugging Guide', url: 'https://docs.docker.com/engine/reference/commandline/inspect/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd17_q1',
                question: 'What does an exit code of 137 indicate when inspecting a stopped Docker container?',
                options: [
                  'The container was terminated by SIGKILL (typically due to Out Of Memory / OOM killer)',
                  'The container completed normally with 0 errors',
                  'Port 137 was blocked by the firewall',
                  'The Dockerfile syntax was invalid'
                ],
                correctIndex: 0,
                topic: 'Exit Code 137',
                explanation: 'Exit code 137 is calculated as 128 + 9 (SIGKILL), which the Linux kernel issues when a container exceeds its cgroup memory limit.'
              }
            ]
          },
          practicalTask: {
            title: 'Inspect Container Exit Status',
            difficulty: 'Beginner',
            problemStatement: 'Write the command to inspect container `my-crashed-app` formatting output to print `.State.ExitCode` and `.State.OOMKilled`.',
            instructions: 'Use docker inspect with --format.',
            requirements: ['docker inspect --format "{{.State.ExitCode}} {{.State.OOMKilled}}" my-crashed-app'],
            starterCode: `docker inspect --format `,
            solutionCode: `docker inspect --format "{{.State.ExitCode}} {{.State.OOMKilled}}" my-crashed-app`,
            hints: ['Use docker inspect --format "{{.State.ExitCode}} {{.State.OOMKilled}}" <container_name>.']
          }
        },
        {
          lessonNumber: 18,
          title: 'Production Container Architecture',
          description: 'Design enterprise high-availability container patterns, graceful SIGTERM handling, and immutable infrastructure principles.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement graceful SIGTERM shutdown handling in Node.js and Python',
            'Handle init process duties (PID 1 zombie process reaping with Tini)',
            'Apply 12-factor immutable container infrastructure patterns'
          ],
          introduction: `In production, containers are constantly created, scaled, and destroyed. Applications must handle the \`SIGTERM\` signal gracefully to close database connections and finish active HTTP requests before termination, preventing data corruption and dropped user requests.`,
          deepDiveSections: [
            {
              title: 'PID 1 Problem & Zombie Process Reaping',
              explanation: `Inside a container, the main process runs as PID 1. In Linux, PID 1 has special responsibilities:
1. Signal Forwarding: It must catch and forward signals like SIGTERM to child processes.
2. Zombie Reaping: It must reap orphaned child processes.
If your Node.js application runs directly as PID 1 without an init system, it may ignore SIGTERM and leave zombie processes.
Solution: Use the lightweight \`--init\` flag (which injects Tini) or wrap your entrypoint with \`tini\`.`,
              keyPoint: 'Use an init process (tini) or --init flag to properly handle signal forwarding and zombie process reaping.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Direct Process vs. Init-Wrapped Container',
            headers: ['Dimension', 'Direct Node.js PID 1', 'Init-Wrapped (Tini / --init)'],
            rows: [
              ['SIGTERM Handling', 'May fail to forward signals to subprocesses', 'Guaranteed graceful forwarding to all children'],
              ['Zombie Reaping', 'Orphaned child processes accumulate in memory', 'Automatic zombie process cleanup'],
              ['Shutdown Time', '10s timeout until Docker issues SIGKILL', 'Immediate graceful cleanup in milliseconds']
            ]
          },
          coreConcepts: ['Graceful SIGTERM HTTP drain', 'PID 1 init system (`tini`)', 'Immutable infrastructure principles'],
          syntax: `# Run with Tini init system
docker run -d --name api --init my-app:latest`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Graceful shutdown handler in Node.js
const server = app.listen(PORT, () => console.log('Server running'));

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed. Closing DB connections...');
    await mongoose.connection.close();
    process.exit(0);
  });
});`,
              explanation: 'Graceful shutdown draining active HTTP connections before closing database sockets.'
            }
          ],
          commonMistakes: ['Calling process.exit(0) immediately on SIGTERM before waiting for active in-flight requests to complete'],
          bestPractices: ['Always implement SIGTERM signal handlers and use `docker run --init` in production'],
          summary: `Graceful signal handling and init process management ensure clean, zero-data-loss container lifecycles.`,
          resources: [{ title: 'Docker Init & Tini Documentation', url: 'https://github.com/krallin/tini', provider: 'GitHub', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'd18_q1',
                question: 'What is the role of an init system like Tini (or the `docker run --init` flag) inside a container?',
                options: [
                  'Acts as PID 1 to reap zombie processes and properly forward signals like SIGTERM to application processes',
                  'Increases CPU clock speed',
                  'Compiles JavaScript code to machine code',
                  'Encrypts network packets'
                ],
                correctIndex: 0,
                topic: 'PID 1 & Init Systems',
                explanation: 'An init system as PID 1 handles Linux signal forwarding and automatically reaps dead child processes.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement Graceful SIGTERM Listener in Node.js',
            difficulty: 'Intermediate',
            problemStatement: 'Write the Node.js `process.on` event listener for `SIGTERM` that logs a message and closes an Express `server` instance.',
            instructions: 'Listen for SIGTERM and call server.close().',
            requirements: ['process.on("SIGTERM", ...)', 'server.close(...)'],
            starterCode: `process.on('SIGTERM', () => {\n  // TODO: Close server gracefully\n});`,
            solutionCode: `process.on('SIGTERM', () => {\n  console.log('Closing server...');\n  server.close(() => {\n    process.exit(0);\n  });\n});`,
            hints: ['Call server.close() inside the SIGTERM callback and exit with 0.']
          }
        }
      ]
    },
    {
      title: 'Phase 7: Real-World Project',
      order: 7,
      lessons: [
        {
          lessonNumber: 19,
          title: 'Containerizing a MERN Application',
          description: 'Write production multi-stage Dockerfiles for both a React Vite frontend and an Express MongoDB backend.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Build a high-performance Nginx static server for React SPAs',
            'Configure client-side SPA routing fallbacks in Nginx (`try_files $uri /index.html`)',
            'Containerize Express APIs with secure non-root user execution'
          ],
          introduction: `In this capstone phase, we will containerize a complete production MERN (MongoDB, Express, React, Node.js) web application. We will write optimized Dockerfiles for the React client and Express API, and configure Nginx to serve the compiled frontend.`,
          deepDiveSections: [
            {
              title: 'React Single Page Application (SPA) Nginx Architecture',
              explanation: `React uses client-side routing (React Router). If a user refreshes \`/dashboard\`, Nginx must not look for a physical file named \`dashboard.html\`.
The custom Nginx configuration enforces:
\`try_files $uri $uri/ /index.html;\`
This ensures all client routes fall back to \`index.html\`, allowing React Router to render the correct view.`,
              keyPoint: 'React SPAs require Nginx try_files configuration to enable client-side routing.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Development Server vs. Production Nginx SPA',
            headers: ['Metric', 'Vite Dev Server (npm run dev)', 'Production Nginx Container'],
            rows: [
              ['Throughput', '~500 req/sec (Single-threaded Node)', '~15,000 req/sec (Event-driven C binary)'],
              ['Memory Footprint', '180 MB – 300 MB', '8 MB – 15 MB'],
              ['Static Caching', 'No client caching', 'Gzip/Brotli compression + Cache-Control headers']
            ]
          },
          coreConcepts: ['React multi-stage build with Nginx runner', 'SPA client-side routing fallbacks', 'Non-root Express API containerization'],
          syntax: `# Nginx SPA routing directive
location / {
  root /usr/share/nginx/html;
  index index.html;
  try_files $uri $uri/ /index.html;
}`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `# Frontend Production Dockerfile (React + Nginx)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
              explanation: 'Production React multi-stage Dockerfile serving compiled assets via Nginx.'
            }
          ],
          commonMistakes: ['Forgetting the try_files directive in Nginx, causing HTTP 404 errors whenever users refresh nested routes'],
          bestPractices: ['Enable gzip compression in Nginx configuration to reduce asset payload sizes over the wire'],
          summary: `Serving compiled React static bundles through Alpine Nginx yields high-throughput, low-memory production frontends.`,
          resources: [{ title: 'Deploying React with Nginx and Docker', url: 'https://docs.docker.com/samples/react/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd19_q1',
                question: 'Why is `try_files $uri $uri/ /index.html;` required in the Nginx configuration for a React Single Page Application (SPA)?',
                options: [
                  'To allow client-side routing (React Router) to handle nested URLs when users refresh the page',
                  'To prevent users from viewing the source code',
                  'To enable WebSockets',
                  'Because Nginx cannot read HTML files directly'
                ],
                correctIndex: 0,
                topic: 'SPA Nginx Routing',
                explanation: 'In an SPA, nested routes do not exist as physical files on disk; Nginx must route all requests to index.html so React Router can render the route.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a React + Nginx Multi-Stage Dockerfile',
            difficulty: 'Intermediate',
            problemStatement: 'Complete the production multi-stage Dockerfile for a React application that builds with `node:20-alpine` and serves with `nginx:alpine`.',
            instructions: 'Define the builder stage and copy dist to /usr/share/nginx/html.',
            requirements: ['FROM node:20-alpine AS builder', 'RUN npm run build', 'FROM nginx:alpine', 'COPY --from=builder /app/dist /usr/share/nginx/html'],
            starterCode: `FROM node:20-alpine AS builder\nWORKDIR /app\n`,
            solutionCode: `FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`,
            hints: ['Build in stage 1, copy from builder to /usr/share/nginx/html in stage 2.']
          }
        },
        {
          lessonNumber: 20,
          title: 'Production Docker Compose for MERN',
          description: 'Orchestrate the complete MERN application with frontend, backend, MongoDB database, and Nginx reverse proxy routing.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Assemble a production-grade 4-service Docker Compose stack (Client, Server, DB, Nginx Proxy)',
            'Configure reverse proxy path routing (/ -> Client, /api -> Server)',
            'Enforce persistent database volumes and automatic restart policies'
          ],
          introduction: `Now we will unite our containerized MERN application into a cohesive production stack. An Nginx reverse proxy routes incoming port 80 traffic: client routes go to the React frontend container, while \`/api/*\` calls route to the Express backend container.`,
          deepDiveSections: [
            {
              title: 'Unified Reverse Proxy Routing Architecture',
              explanation: `By routing both frontend and backend through a single Nginx reverse proxy:
1. Eliminates Cross-Origin Resource Sharing (CORS) issues because all client API calls share the same domain and port (\`/api\`).
2. Centralizes SSL termination and rate-limiting at the proxy level.
3. Completely shields the Express API and MongoDB database from direct public exposure.`,
              keyPoint: 'Unified reverse proxy routing eliminates CORS issues and secures internal backend services.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Direct Port Exposure vs. Unified Reverse Proxy',
            headers: ['Feature', 'Direct Port Exposure (:3000, :5000)', 'Unified Reverse Proxy (:80)'],
            rows: [
              ['CORS Headers', 'Must be enabled and configured on Express API', 'Eliminated (Single origin on port 80)'],
              ['SSL Certificates', 'Must be installed on each individual service', 'Terminated once at the Nginx edge proxy'],
              ['Port Management', 'Multiple ports open on firewall (3000, 5000, 27017)', 'Single clean port 80/443 exposed']
            ]
          },
          coreConcepts: ['Unified reverse proxy architecture', 'CORS elimination via path routing', 'Database named volume persistence'],
          syntax: `# Reverse proxy routing in Nginx
location /api/ {
  proxy_pass http://backend:5000/;
  proxy_set_header Host $host;
}`,
          codeExamples: [
            {
              language: 'yaml',
              code: `version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - backend
    restart: always

  frontend:
    build: ./client
    restart: unless-stopped

  backend:
    build: ./server
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://database:27017/zenscore
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: mongo:7-jammy
    volumes:
      - mongo_data:/data/db
    restart: always

volumes:
  mongo_data:`,
              explanation: 'Production MERN stack orchestrated via Docker Compose.'
            }
          ],
          commonMistakes: ['Hardcoding localhost in client API calls instead of using relative URLs like /api/v1/users'],
          bestPractices: ['Always use relative URLs (/api) in frontend code when behind an Nginx reverse proxy'],
          summary: `Orchestrating MERN with an Nginx reverse proxy simplifies architecture, eliminates CORS, and secures database storage.`,
          resources: [{ title: 'Full Stack Docker Compose Guide', url: 'https://docs.docker.com/samples/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'd20_q1',
                question: 'Why does routing frontend and backend through a single Nginx reverse proxy eliminate CORS errors?',
                options: [
                  'Because the browser perceives all requests as originating from the same protocol, host, and port',
                  'Because Nginx disables all browser security checks',
                  'Because Docker encodes headers in binary',
                  'Because CORS is only enforced on Windows'
                ],
                correctIndex: 0,
                topic: 'CORS & Reverse Proxies',
                explanation: 'Same-Origin Policy allows requests without CORS headers when both the frontend app and API share the exact same host and port.'
              }
            ]
          },
          practicalTask: {
            title: 'Define the MERN Stack Compose Services',
            difficulty: 'Intermediate',
            problemStatement: 'Write the `docker-compose.yml` service definitions for `frontend` (build: ./client) and `backend` (build: ./server) with a shared named volume `db_data` under `mongo` service.',
            instructions: 'Include services for frontend, backend, and mongo.',
            requirements: ['services with frontend, backend, mongo', 'volumes with db_data'],
            starterCode: `version: '3.8'\nservices:\n`,
            solutionCode: `version: '3.8'\nservices:\n  frontend:\n    build: ./client\n  backend:\n    build: ./server\n  mongo:\n    image: mongo:7\n    volumes:\n      - db_data:/data/db\nvolumes:\n  db_data:`,
            hints: ['Define frontend, backend, mongo, and the top-level volumes key.']
          }
        },
        {
          lessonNumber: 21,
          title: 'Build, Test & Deploy the Containerized Application',
          description: 'Capstone project: Execute automated integration tests, build multi-stage images, deploy to cloud hosts, and verify live endpoints.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Execute end-to-end multi-container integration tests',
            'Deploy the full MERN application onto a cloud Linux host',
            'Perform health verification and smoke testing on production endpoints'
          ],
          introduction: `Congratulations on reaching the final capstone lesson! In this lesson, we will run automated tests against our containerized MERN application, build production multi-stage images, deploy the stack with Docker Compose, and verify that the application is fully operational.`,
          deepDiveSections: [
            {
              title: 'End-to-End Production Deployment Checklist',
              explanation: `Before releasing a containerized application to production:
1. Security Audit: Run \`trivy image\` on both frontend and backend images.
2. Configuration Check: Verify all sensitive credentials are in \`.env\` and excluded from Git.
3. Healthcheck Verification: Ensure all containers report status \`(healthy)\`.
4. Log Verification: Confirm log rotation is active and disk usage is bounded.
5. Backup Automation: Verify database volume snapshot scripts are scheduled via cron.`,
              keyPoint: 'A complete container deployment includes automated testing, health verification, and scheduled volume backups.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Development vs. Production Deployment State',
            headers: ['Feature', 'Development Mode', 'Production Capstone State'],
            rows: [
              ['Build Type', 'Hot-reloading unoptimized files', 'Multi-stage optimized immutable images'],
              ['Security', 'Root execution with devDependencies', 'Non-root user with zero build tools in image'],
              ['Persistence', 'Local bind mounts', 'Dedicated named volumes with automated backup'],
              ['Network', 'Single flat default network', 'Segmented frontend and backend private subnets']
            ]
          },
          coreConcepts: ['Full-stack container deployment', 'Automated smoke testing', 'Production maintenance checklist'],
          syntax: `# Production deployment and verification
docker compose up -d --build
docker compose ps
curl -I http://localhost/health
docker compose logs --tail=50`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Capstone Deployment Pipeline
set -e
echo "1. Building images..."
docker compose build

echo "2. Launching production stack..."
docker compose up -d

echo "3. Waiting for database healthcheck..."
docker compose exec -T database mongosh --eval "db.adminCommand('ping')"

echo "4. Running backend smoke tests..."
curl -f http://localhost:80/api/health || exit 1

echo "SUCCESS: MERN Production Container Stack is LIVE!"`,
              explanation: 'Full automated deployment and smoke-test script.'
            }
          ],
          commonMistakes: ['Skipping smoke tests after deployment, leading to unnoticed runtime configuration errors'],
          bestPractices: ['Always execute an automated health probe script immediately following container deployment'],
          summary: `You have mastered Docker and Containerization from kernel isolation primitives to enterprise multi-service production architectures!`,
          resources: [{ title: 'Production Container Engineering Handbook', url: 'https://docs.docker.com/engine/', provider: 'Docker.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'd21_q1',
                question: 'What is the primary purpose of a smoke test script following a container deployment?',
                options: [
                  'To automatically ping live endpoints and verify that the application and database are healthy and responding',
                  'To compile the code a second time',
                  'To delete old log files',
                  'To reboot the host server'
                ],
                correctIndex: 0,
                topic: 'Deployment Smoke Testing',
                explanation: 'Smoke testing immediately verifies that all containerized services, networks, and databases are operational and accepting requests.'
              }
            ]
          },
          practicalTask: {
            title: 'Execute Full Stack Health Verification',
            difficulty: 'Intermediate',
            problemStatement: 'Write the bash command to test that the production web server returns HTTP status 200 on `http://localhost/api/health` using `curl -f`.',
            instructions: 'Use curl with the -f and -s flags.',
            requirements: ['curl -fsS http://localhost/api/health'],
            starterCode: `curl `,
            solutionCode: `curl -fsS http://localhost/api/health`,
            hints: ['Use curl -fsS http://localhost/api/health to verify endpoint availability.']
          }
        }
      ]
    }
  ]
}

module.exports = { dockerCurriculum }
