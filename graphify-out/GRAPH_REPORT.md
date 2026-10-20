# Graph Report - Lexify  (2026-10-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1704 nodes · 5846 edges · 74 communities (60 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 185 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `788ed324`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69

## God Nodes (most connected - your core abstractions)
1. `next` - 107 edges
2. `User` - 79 edges
3. `isLocale()` - 74 edges
4. `db()` - 70 edges
5. `useI18n()` - 68 edges
6. `fmt()` - 62 edges
7. `getMessages()` - 58 edges
8. `HttpError` - 55 edges
9. `lucide-react` - 54 edges
10. `get_translator()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `_criteria()` --uses--> `IELTSWritingEvaluation`  [INFERRED]
  app/api/ielts.py → app/services/ielts_service.py
- `init_db()` --uses--> `Base`  [INFERRED]
  app/database/session.py → app/database/models.py
- `link_telegram()` --uses--> `User`  [INFERRED]
  app/api/auth.py → app/database/models.py
- `login()` --uses--> `User`  [INFERRED]
  app/api/auth.py → app/database/models.py
- `register()` --uses--> `User`  [INFERRED]
  app/api/auth.py → app/database/models.py

## Import Cycles
- None detected.

## Communities (74 total, 14 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (88): AdminBroadcasts(), AdminCourse(), AdminLesson(), AdminContent(), AdminLayout(), metadata, AdminOrders(), STATUSES (+80 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (32): lucide-react, CabinetPage(), SkillDashboardPage(), revalidate, metadata, ResultPage(), Tips(), BandRing() (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (4): Word, ReverseTranslation, WordExplanation, WordService

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (33): firebase, AuthAction(), onReset(), continuePath(), State, AuthActionPage(), LoginForm(), onSubmit() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (29): _load_user_word(), start_session(), submit_answer(), ActivityPoint, AddWordsRequest, AddWordsResponse, AnswerRequest, AnswerResponse (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (34): COLORS, seedAnswerKeys, seedDiagnosticTasks, ALL, exercises, mocks, seedPracticeAnswerKeys, seedPracticeTasks (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (14): ShadowingTranscriptResponse, get_transcript(), list_videos(), remove_bookmark(), submit_transcript(), upsert_bookmark(), ShadowingBookmark, ShadowingTranscript (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (19): language_callback(), language_handler(), learning_callback(), learning_handler(), ui_callback(), cancel_keyboard(), colloc_front_keyboard(), colloc_grade_keyboard() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (28): next, DELETE, POST, POST, DELETE, POST, Body, POST (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (10): daily_review_reminder(), word_of_the_day(), close_db(), get_session(), init_db(), health_check(), lifespan(), telegram_webhook() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (35): Body, POST, listOrders(), listPromos(), OrderRow, PromoInput, PromoRow, savePromo() (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (20): dynamic, RootLayout(), viewport, SiteLayout(), I18nProvider(), SiteFooter(), SocialIcon(), Doc (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): _clear_quiz_data(), colloc_reveal_handler(), _format_word_html(), _h(), _handle_batch_progress(), _handle_collocations_section(), _handle_grammar_section(), _handle_ielts_section() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (28): generateMetadata(), SkillLayout(), LessonsPage(), PracticePage(), generateMetadata(), generateMetadata(), generateMetadata(), metadata (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (10): read_languages(), read_my_activity(), read_my_stats(), read_users_me(), update_users_me(), Base, DailyActivity, User (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (25): zod, Meta, POST, Body, maxDuration, POST, Body, POST (+17 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (30): AttemptReviewPage(), metadata, metadata, ReviewPage(), PracticeRunPage(), DiagnosticTestPage(), toHalfBand(), taskForMode() (+22 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (26): generateMetadata(), LessonPage(), freeLesson(), generateMetadata(), PreviewLessonPage(), revalidate, revalidate, sitemap() (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (12): get_current_user(), get_db(), _criteria(), delete_essay(), evaluate(), get_essay(), list_essays(), _now() (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (22): AuthLayout(), metadata, NotFound(), AdminShell(), AppShell(), SkillTabs(), Ctx, I18nContext (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (3): add_topic_pack(), list_topics(), _split_emoji()

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (14): ask_handler(), collocations_handler(), ielts_handler(), quiz_command_handler(), quiz_mode_handler(), _short_translation(), start_handler(), word_quiz_callback() (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (11): link_telegram(), login(), register(), serialize_user(), telegram_login(), validate_init_data(), TelegramAuthData, Token (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (20): server-only, aiProviders(), AiUsageRow, LogRow, SettingsInput, grader(), speechToText(), COMMON_MISTAKES (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (3): LibraryPage, _now_utc(), QuizService

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (22): react, PurchaseRow, Purchases(), send(), statusStyle, applyPromo(), submit(), SandboxPay() (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (24): seedDocuments(), seedMissing(), applyUserAction(), searchUsers(), toRow(), UserDetail, UserRow, AiConfig (+16 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (14): clear_handler(), delete_handler(), error_handler(), _get_ui_lang(), library_handler(), library_page_callback(), progress_handler(), register_handlers() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (10): WordResponse, add_words(), delete_word(), get_my_words(), get_word(), lookup_word(), _now(), serialize_word() (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (5): Collocation, UserCollocation, CollocationLibraryPage, CollocationLibraryService, _now_utc()

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (22): HubData, HubSection, DiagnosticState, Mode, MODES, SectionState, Skill, hasAnyAccess() (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.09
Nodes (16): firebase-admin, vitest, [email, flag], batch, db, existing, force, writes (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (3): IELTSCriteria, IELTSService, IELTSWritingEvaluation

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (12): Body, POST, POST(), activeProvider(), providerById(), sandboxAllowed(), sandboxProvider, secret() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (19): Checkout(), choose(), requote(), Plan, PlanCard(), Quote, Row(), Price() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (10): _clear_colloc_quiz_data(), colloc_grade_handler(), _colloc_links_to_batch(), colloc_quiz_cancel_handler(), colloc_quiz_command_handler(), colloc_quiz_skip_handler(), _handle_colloc_batch_progress(), _send_colloc_card() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (13): AudioOnce(), play(), ObjectiveTest(), FIXED, QuestionView(), SaveState, TestShell(), TestUrls (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (7): clear_history(), get_history(), _now(), send_message(), ChatMessageResponse, ChatRequest, ChatMessage

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (17): clsx, firebase-tools, @fontsource-variable/fraunces, @fontsource-variable/manrope, @playwright/test, react-dom, react-markdown, tailwindcss (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (15): Body, bootstrapAdmins(), cookieBase, DELETE, POST, Body, POST, GET() (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (6): analyze_code(), generate_improvement(), get_random_file(), git_commit_and_push(), main(), verify_syntax()

### Community 44 - "Community 44"
Cohesion: 0.41
Nodes (10): CabinetLayout(), metadata, AccountPage(), BuyPage(), DiagnosticHubPage(), FirebaseMissing(), pick(), getCourses() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (13): Item, LevelMeter(), pickMime(), speak(), SpeakingTest(), finish(), recordTest(), startRecording() (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.27
Nodes (13): questionsOf(), PRACTICE_KINDS, PracticeCard, PracticeKind, PracticeTask, activeAccess(), attemptsCol(), getPracticeTask() (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (13): Audience, AUDIENCES, BroadcastRow, Localized, Broadcast, BroadcastInput, broadcastsFor(), col() (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (9): alt, contentType, fonts(), OgImage(), size, defaultLocale, config, preferredLocale() (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (13): dependencies, clsx, firebase, firebase-admin, @fontsource-variable/fraunces, @fontsource-variable/manrope, lucide-react, next (+5 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-next, firebase-tools, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+5 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (11): scripts, build, dev, emulators, lint, make-admin, seed, start (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.20
Nodes (5): menu_handler(), _quiz_mode_menu(), section_callback(), word_more_callback(), section_menu_keyboard()

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (3): generate_referral_link(), generate_share_text(), parse_referral_code()

### Community 56 - "Community 56"
Cohesion: 0.46
Nodes (4): _column_exists(), _index_exists(), sync_schema(), _telegram_id_is_nullable()

### Community 57 - "Community 57"
Cohesion: 0.43
Nodes (3): calculate_sm2(), calculate_sm2_batch(), SRSState

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): get_text(), get_translator(), _t()

### Community 59 - "Community 59"
Cohesion: 0.38
Nodes (3): Badge, calculate_user_badges(), serialize_badges()

### Community 60 - "Community 60"
Cohesion: 0.48
Nodes (4): HomePage(), revalidate, JsonLd(), SectionHeading()

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (3): colloc_library_page_callback(), mycollocations_handler(), _send_colloc_library_page()

### Community 64 - "Community 64"
Cohesion: 0.60
Nodes (3): highlightSegments(), isWord(), Segment

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): eslint, eslint-config-next, eslintConfig

## Knowledge Gaps
- **13 isolated node(s):** `clsx`, `firebase-tools`, `@fontsource-variable/fraunces`, `@fontsource-variable/manrope`, `@playwright/test` (+8 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 544 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `create_access_token()` connect `Community 22` to `Community 16`?**
  _High betweenness centrality (0.477) - this node is a cross-community bridge._
- **Are the 40 inferred relationships involving `User` (e.g. with `link_telegram()` and `login()`) actually correct?**
  _`User` has 40 INFERRED edges - model-reasoned connections that need verification._
- **What connects `clsx`, `firebase-tools`, `@fontsource-variable/fraunces` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05784352925496468 - nodes in this community are weakly interconnected._
- **Why does `User` connect `Community 14` to `Community 2`, `Community 4`, `Community 37`, `Community 6`, `Community 7`, `Community 9`, `Community 18`, `Community 20`, `Community 22`, `Community 24`, `Community 27`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.141156462585034 - nodes in this community are weakly interconnected._
- **Why does `server-only` connect `Community 23` to `Community 0`, `Community 33`, `Community 5`, `Community 39`, `Community 8`, `Community 10`, `Community 11`, `Community 44`, `Community 46`, `Community 47`, `Community 16`, `Community 17`, `Community 26`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._