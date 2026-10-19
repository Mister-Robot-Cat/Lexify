/**
 * Legal page templates. They describe how the platform actually works
 * (one-time plans, 7-day refund, server-side AI scoring) but are not legal
 * advice: have them reviewed and fill in your company details before launch.
 */
import type { Locale } from "@/lib/i18n/config";

export const LEGAL_UPDATED = "2026-10-19";
export type LegalDoc = "terms" | "privacy" | "refund";

type Doc = { title: string; body: string };

export const legal: Record<LegalDoc, Record<Locale, Doc>> = {
  terms: {
    en: {
      title: "Terms of service",
      body: `These terms govern your use of Lexify (the "Service"), an online platform for IELTS Academic self-study. By creating an account you accept them.

## 1. The Service
Lexify provides lessons, practice tests, a diagnostic test and automated feedback on writing and speaking. Scores produced by the Service are estimates for study purposes and are **not official IELTS results**.

## 2. Your account
You must provide a valid email address and keep your password secret. One account is for one person. You are responsible for activity under your account.

## 3. Plans and access
Access to a course is sold as a **one-time plan** for a fixed number of days. Plans do **not renew automatically**. Access starts when the order is confirmed and ends after the purchased number of days.

## 4. Fair use
You may not copy, resell or publish Lexify materials, share your account, or try to obtain answer keys or interfere with scoring. We may limit automated feedback per user to keep the Service available for everyone.

## 5. Refunds
Paid plans come with a 7-day money-back guarantee, described in the Refund policy.

## 6. Liability
The Service is provided "as is". We do our best to keep it available and accurate but do not guarantee any particular exam result.

## 7. Changes
We may update these terms. If changes are significant we will notify you by email or in your account.

## 8. Contact
Questions about these terms: the support email shown in the site footer.`,
    },
    az: {
      title: "İstifadə şərtləri",
      body: `Bu şərtlər IELTS Academic-ə müstəqil hazırlıq üçün onlayn platforma olan Lexify-dan ("Xidmət") istifadəni tənzimləyir. Hesab yaratmaqla bu şərtləri qəbul edirsiniz.

## 1. Xidmət
Lexify dərslər, sınaq testləri, diaqnostika testi və yazı ilə danışığa avtomatik rəy təqdim edir. Xidmətin verdiyi ballar hazırlıq məqsədli təxminlərdir və **rəsmi IELTS nəticəsi deyil**.

## 2. Hesabınız
Etibarlı e-poçt ünvanı göstərməli və şifrənizi gizli saxlamalısınız. Bir hesab bir nəfər üçündür. Hesabınızda baş verən fəaliyyətə görə siz cavabdehsiniz.

## 3. Planlar və giriş
Kursa giriş müəyyən gün sayı üçün **birdəfəlik plan** kimi satılır. Planlar **avtomatik yenilənmir**. Giriş sifariş təsdiqləndikdən sonra başlayır və alınmış gün sayı bitdikdə sona çatır.

## 4. Ədalətli istifadə
Lexify materiallarını köçürmək, yenidən satmaq və ya yaymaq, hesabınızı başqası ilə paylaşmaq, cavab açarlarını əldə etməyə və ya qiymətləndirməyə müdaxilə etməyə cəhd etmək qadağandır. Xidmətin hamı üçün əlçatan qalması üçün bir istifadəçiyə düşən avtomatik rəy sayını məhdudlaşdıra bilərik.

## 5. Pulun qaytarılması
Ödənişli planlara 7 günlük pulun geri qaytarılması zəmanəti şamil olunur. Ətraflı məlumat Geri qaytarma siyasətindədir.

## 6. Məsuliyyət
Xidmət "olduğu kimi" təqdim olunur. Onun əlçatan və dəqiq olması üçün əlimizdən gələni edirik, lakin konkret imtahan nəticəsinə zəmanət vermirik.

## 7. Dəyişikliklər
Bu şərtləri yeniləyə bilərik. Dəyişikliklər əhəmiyyətli olarsa, sizə e-poçtla və ya hesabınızda xəbər verəcəyik.

## 8. Əlaqə
Bu şərtlərlə bağlı suallar üçün saytın aşağı hissəsində göstərilən dəstək ünvanına yazın.`,
    },
    ru: {
      title: "Условия использования",
      body: `Эти условия регулируют использование Lexify («Сервис»), онлайн-платформы для самостоятельной подготовки к IELTS Academic. Создавая аккаунт, вы принимаете эти условия.

## 1. Сервис
Lexify предоставляет уроки, пробные тесты, диагностический тест и автоматическую обратную связь по письму и устной речи. Баллы, которые выдаёт Сервис, являются ориентиром для подготовки и **не являются официальным результатом IELTS**.

## 2. Ваш аккаунт
Вы указываете действующий email и храните пароль в тайне. Один аккаунт предназначен для одного человека. Вы отвечаете за действия, совершённые в вашем аккаунте.

## 3. Тарифы и доступ
Доступ к курсу продаётся как **разовый тариф** на определённое число дней. Тарифы **не продлеваются автоматически**. Доступ начинается после подтверждения заказа и заканчивается по истечении оплаченного срока.

## 4. Добросовестное использование
Запрещено копировать, перепродавать или публиковать материалы Lexify, передавать аккаунт другим людям, пытаться получить ключи ответов или вмешиваться в подсчёт баллов. Мы можем ограничивать число автоматических проверок на пользователя, чтобы Сервис оставался доступным для всех.

## 5. Возврат
На платные тарифы действует гарантия возврата денег в течение 7 дней, описанная в Политике возврата.

## 6. Ответственность
Сервис предоставляется «как есть». Мы делаем всё, чтобы он был доступен и точен, но не гарантируем конкретный результат экзамена.

## 7. Изменения
Мы можем обновлять эти условия. О существенных изменениях мы сообщим по email или в аккаунте.

## 8. Контакты
Вопросы по условиям присылайте на адрес поддержки, указанный внизу сайта.`,
    },
  },
  privacy: {
    en: {
      title: "Privacy policy",
      body: `This policy explains what data Lexify collects and how it is used.

## What we collect
- **Account data:** email address, display name, chosen interface language.
- **Study data:** test attempts, answers, scores, essays and speaking recordings you submit.
- **Order data:** plans you choose, promo codes used and order status. Card details are handled by the payment provider and never stored by Lexify.
- **Technical data:** cookies needed to keep you signed in and remember your language.

## How we use it
To provide the Service, score your work, show your progress, answer support requests and prevent abuse. Essays and speaking recordings are sent to an automated scoring provider only to produce your feedback.

## Where data is stored
Data is stored with Google Firebase (Authentication, Firestore and Cloud Storage). The website is hosted on Vercel.

## How long we keep it
Account and study data are kept while your account exists. Speaking recordings are kept for up to 12 months. You can ask us to delete your account at any time.

## Your rights
You can request a copy of your data, its correction or deletion by writing to the support email.

## Cookies
We use only the cookies required for sign-in and language preference. We do not use advertising cookies.

## Contact
Privacy questions: the support email shown in the site footer.`,
    },
    az: {
      title: "Məxfilik siyasəti",
      body: `Bu siyasət Lexify-ın hansı məlumatları topladığını və onlardan necə istifadə etdiyini izah edir.

## Nələri toplayırıq
- **Hesab məlumatları:** e-poçt ünvanı, görünən ad, seçilmiş interfeys dili.
- **Təhsil məlumatları:** test cəhdləri, cavablar, ballar, göndərdiyiniz esselər və danışıq səsyazmaları.
- **Sifariş məlumatları:** seçdiyiniz planlar, istifadə olunan promokodlar və sifariş statusu. Kart məlumatları ödəniş provayderi tərəfindən emal olunur və Lexify-da saxlanılmır.
- **Texniki məlumatlar:** hesabda qalmanız və dilinizin yadda saxlanması üçün lazım olan cookie faylları.

## Necə istifadə edirik
Xidməti təqdim etmək, işlərinizi qiymətləndirmək, irəliləyişinizi göstərmək, dəstək sorğularına cavab vermək və sui-istifadənin qarşısını almaq üçün. Esse və səsyazmalar yalnız rəy hazırlamaq üçün avtomatik qiymətləndirmə provayderinə göndərilir.

## Məlumatlar harada saxlanılır
Məlumatlar Google Firebase-də (Authentication, Firestore və Cloud Storage) saxlanılır. Sayt Vercel-də yerləşdirilib.

## Nə qədər saxlayırıq
Hesab və təhsil məlumatları hesabınız mövcud olduqca saxlanılır. Danışıq səsyazmaları 12 aya qədər saxlanılır. İstənilən vaxt hesabınızın silinməsini xahiş edə bilərsiniz.

## Hüquqlarınız
Dəstək ünvanına yazaraq məlumatlarınızın surətini, düzəldilməsini və ya silinməsini tələb edə bilərsiniz.

## Cookie faylları
Yalnız daxil olmaq və dil seçimi üçün lazım olan cookie fayllarından istifadə edirik. Reklam cookie-lərindən istifadə etmirik.

## Əlaqə
Məxfiliklə bağlı suallar üçün saytın aşağı hissəsindəki dəstək ünvanına yazın.`,
    },
    ru: {
      title: "Политика конфиденциальности",
      body: `Эта политика объясняет, какие данные собирает Lexify и как они используются.

## Что мы собираем
- **Данные аккаунта:** email, отображаемое имя, выбранный язык интерфейса.
- **Учебные данные:** попытки тестов, ответы, баллы, ваши эссе и записи устных ответов.
- **Данные заказов:** выбранные тарифы, использованные промокоды и статус заказа. Данные карт обрабатывает платёжный провайдер, Lexify их не хранит.
- **Технические данные:** cookie, необходимые для входа в аккаунт и запоминания языка.

## Как мы их используем
Чтобы предоставлять Сервис, оценивать ваши работы, показывать прогресс, отвечать на обращения и предотвращать злоупотребления. Эссе и записи речи передаются сервису автоматической оценки только для подготовки разбора.

## Где хранятся данные
Данные хранятся в Google Firebase (Authentication, Firestore и Cloud Storage). Сайт размещён на Vercel.

## Сколько мы их храним
Данные аккаунта и учёбы хранятся, пока существует аккаунт. Записи устных ответов хранятся до 12 месяцев. Вы можете в любой момент попросить удалить аккаунт.

## Ваши права
Вы можете запросить копию своих данных, их исправление или удаление, написав на адрес поддержки.

## Cookie
Мы используем только cookie, необходимые для входа и выбора языка. Рекламные cookie не используются.

## Контакты
Вопросы о конфиденциальности присылайте на адрес поддержки внизу сайта.`,
    },
  },
  refund: {
    en: {
      title: "Refund policy",
      body: `## 7-day money-back guarantee
If Lexify isn't right for you, request a refund within **7 days** of your purchase and we will return the full amount. No explanation is required.

## How to request a refund
Write to the support email from the address linked to your account and include your order number. Refunds are sent to the original payment method, usually within 5–10 business days depending on your bank.

## What happens to your access
When a refund is issued, access to the course from that order ends.

## After 7 days
After the 7-day period plans are non-refundable, except where required by law or if the Service was unavailable for a significant part of your plan.

## No automatic renewal
Plans are one-time purchases. You are never charged again unless you buy a new plan yourself.`,
    },
    az: {
      title: "Geri qaytarma siyasəti",
      body: `## 7 günlük pulun geri qaytarılması zəmanəti
Lexify sizə uyğun gəlməsə, alışdan sonrakı **7 gün** ərzində pulun qaytarılmasını tələb edin və biz məbləği tam qaytaracağıq. İzahat tələb olunmur.

## Necə müraciət etmək olar
Hesabınıza bağlı ünvandan dəstək e-poçtuna yazın və sifariş nömrəsini göstərin. Pul ilkin ödəniş üsuluna, bankınızdan asılı olaraq adətən 5–10 iş günü ərzində qaytarılır.

## Girişinizə nə olur
Pul qaytarıldıqda həmin sifarişlə alınmış kursa giriş dayandırılır.

## 7 gündən sonra
7 günlük müddət bitdikdən sonra planlar geri qaytarılmır, qanunla tələb olunan hallar və ya planınızın əhəmiyyətli hissəsində Xidmətin əlçatmaz olduğu hallar istisnadır.

## Avtomatik yenilənmə yoxdur
Planlar birdəfəlik alışdır. Yeni planı özünüz almasanız, sizdən heç vaxt yenidən ödəniş tutulmur.`,
    },
    ru: {
      title: "Политика возврата",
      body: `## Гарантия возврата 7 дней
Если Lexify вам не подошёл, запросите возврат в течение **7 дней** после покупки, и мы вернём всю сумму. Объяснять причину не нужно.

## Как запросить возврат
Напишите на адрес поддержки с email, привязанного к аккаунту, и укажите номер заказа. Деньги возвращаются тем же способом, которым была оплата, обычно за 5–10 рабочих дней в зависимости от банка.

## Что будет с доступом
После возврата доступ к курсу по этому заказу прекращается.

## После 7 дней
По истечении 7 дней тариф не возвращается, кроме случаев, предусмотренных законом, или если Сервис был недоступен значительную часть срока тарифа.

## Без автопродления
Тарифы покупаются разово. Повторных списаний не бывает, пока вы сами не купите новый тариф.`,
    },
  },
};
