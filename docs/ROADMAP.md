# SENTRIX Roadmap

## Foundation MVP (current phase)

Validated event intake, PostgreSQL/Alembic persistence, paginated event API, overview/event explorer/detail UI, synthetic development fixture, and reproducible local workflow. Correlation and incidents remain intentionally absent.

## Foundation hardening in progress

Implemented: configurable database pool bounds, server-generated request IDs, transactionally stored ingestion audit metadata, and a disabled-by-default retention setting with an explicit preview/apply cleanup command.

Still required: close environment-blocked test/build checks; verify PostgreSQL migration and restart persistence; perform frontend browser integration checks; add authentication/authorization, analyst access audit, backup/restore, and operational deployment controls before any shared deployment.

## Then: deterministic correlation

Only after a validated event pipeline and independently maintained scenarios/ground truth exist, define versioned deterministic rules, explicit entity/time constraints, edge evidence, and negative tests. Separate correlation candidate scoring from incident grouping. Measure against a no-correlation baseline.

## Later, evidence permitting

Analyst notes/decisions, incident lifecycle, evaluation dashboard, and advanced graph/probabilistic experiments may follow only when validated use cases and reproducible evaluation justify them. Do not claim a heuristic score is a calibrated probability without calibration evidence.
