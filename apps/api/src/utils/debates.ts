import { from, map } from "rxjs";
import { DebateArgument } from "src/entities/debates/debates.model";
import { EntityNotFoundError } from "src/errors/EntityNotFoundError";

export const getDebates = (getDebatesPromise: Promise<DebateArgument[]>) => {
  return from(getDebatesPromise)
    .pipe(
      map(debateArgs => {
        const res = debateArgs.reduce(
          (acc, crt) => {
            const { debateId, debateTitle, ...argData } = crt;

            if (!debateTitle) {
              throw new EntityNotFoundError('debate');
            }

            acc.metadata = { debateId, debateTitle };
            if (argData.argumentId) {
              acc.args.push(argData);
            }

            return acc;
          },
          { metadata: null, args: [] }
        );

        return res;
      }),
    )
}