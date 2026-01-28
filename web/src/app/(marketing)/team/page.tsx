import Image from "next/image";
import { PageHero } from "@/components/marketing";

const teamMembers = [
  {
    name: "Lisa Frost",
    role: "Marketing Manager",
    image: null,
  },
  {
    name: "Loussi Dishoian",
    role: "Customer Support Manager",
    image: null,
  },
  {
    name: "Eric Vasiliades",
    role: "Technical Support Manager",
    image: null,
  },
];

export default function TeamPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Team"
        backgroundColor="beige"
      />

      {/* Founder Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Founder Image */}
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">SB</span>
                </div>
              </div>
            </div>

            {/* Founder Bio */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-primary">
                Silva Benlian
              </h2>
              <p className="text-xl text-muted-foreground mt-2">
                CEO and Founder
              </p>

              <div className="mt-8 space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Developing and launching a dating app was never part of my plan. Love, relationships and marriage are so different these days.
                </p>
                <p>
                  Everyone&apos;s expectations are so high and there is major lack of honesty and transparency. There are so many dating apps but most of them are developed to keep you single and on their app forever. I wanted to develop an app that helps meet people where they are and get them involved in the process.
                </p>
                <p>
                  I set out to develop a social and dating app that welcomes everyone regardless of what stage of life they are in. Many people get on these dating sites right after a divorce when they are not ready. They have been out of the dating game and don&apos;t even know how to communicate.
                </p>
                <p>
                  I wanted our app to provide resources and opportunities to allow them to heal as they develop new friendships, have resources to help them learn how to navigate this new stage of their lives. You see, I wanted the app to be all about honesty, integrity, transparency, and authenticity! There are way too many phonies in the world, and I did not want them on my app.
                </p>
                <p>
                  So we added features that help eliminate fake profiles, do a better job of verifying. Add features that reward all users for helping one another and take the virtual into real world.
                </p>
                <p>
                  I think the world around us is changing and many people are going back to the old fashion values. We might have gotten off track for a little while, but I think we are ready for a better, kinder world where men act like gentlemen and women act like ladies, where good friends meet and help one another find their ideal match, whatever that might be or whatever they are looking for.
                </p>
                <p>
                  If they are playing a matchmaker or just a wingman, our app is the place to be and you get rewarded for helping others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Meet The <span className="text-brand-primary">Team</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => {
              const initials = member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <div
                  key={member.name}
                  className="bg-white rounded-2xl p-8 text-center shadow-sm"
                >
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-brand-primary"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-brand-primary bg-gradient-to-br from-brand-primary to-brand-secondary mx-auto flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {initials}
                      </span>
                    </div>
                  )}
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-brand-primary font-medium">{member.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
