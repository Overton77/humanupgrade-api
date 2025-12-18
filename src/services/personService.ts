import { Person, IPerson, PersonDoc, PersonModel } from "../models/Person.js";

import { MediaLink } from "../models/MediaLink.js";

import {
  PersonScalarFields,
  PersonScalarUpdateFields,
} from "../graphql/inputs/personInputs.js";

import {
  PersonScalarFieldsSchema,
  PersonScalarUpdateFieldsSchema,
  PersonUpdateWithOptionalIdsInputSchema,
} from "../graphql/inputs/schemas/personSchemas.js";

import { validateInput } from "../lib/validation.js";
import { withTransaction } from "../lib/transactions.js";
import { BaseService } from "./BaseService.js";
import { Errors } from "../lib/errors.js";
import { mergeUniqueBy, mergeUniqueStrings } from "./utils/merging.js";

class PersonService extends BaseService<IPerson, PersonDoc, PersonModel> {
  constructor() {
    super(Person, "personService", "Person");
  }

  async createPerson(input: PersonScalarFields): Promise<IPerson> {
    const validated = validateInput(
      PersonScalarFieldsSchema,
      input,
      "PersonScalarFields"
    );

    const { name, role, bio, mediaLinks } = validated;

    return withTransaction(
      async (session) => {
        const validMediaLinks: MediaLink[] | undefined = mediaLinks?.filter(
          (m): m is MediaLink => !!m.url
        );

        const [person] = await Person.create(
          [
            {
              name,
              role,
              bio,
              mediaLinks: validMediaLinks,

              businessIds: [],
              episodeIds: [],
            },
          ],
          { session }
        );

        return person;
      },
      { operation: "createPersonWithOptionalIds", personName: name }
    );
  }

  async deletePerson(id: string): Promise<IPerson | null> {
    return withTransaction(
      async (session) => {
        return await this.deleteById(id, { session });
      },
      { operation: "deletePerson", personId: id }
    );
  }

  async updatePerson(input: PersonScalarUpdateFields): Promise<IPerson | null> {
    const validated = validateInput(
      PersonScalarUpdateFieldsSchema,
      input,
      "PersonScalarUpdateFields"
    );

    const { id, name, role, bio, mediaLinks } = validated;

    return withTransaction(
      async (session) => {
        const person = await this.findByIdOrNull(id, { session });
        if (!person) return null;

        if (name !== undefined) person.name = name;
        if (role !== undefined) person.role = role;
        if (bio !== undefined) person.bio = bio;

        if (mediaLinks !== undefined) {
          const validMediaLinks = mediaLinks.filter(
            (m): m is MediaLink => !!m.url
          );
          person.mediaLinks = mergeUniqueBy(
            person.mediaLinks ?? [],
            validMediaLinks,
            (m: MediaLink) => m.url
          );
        }

        await person.save({ session });
        return person;
      },
      { operation: "updatePersonWithOptionalIds", personId: id }
    );
  }
}

export const personService = new PersonService();

export const createPerson = (input: PersonScalarFields) =>
  personService.createPerson(input);

export const updatePerson = (input: PersonScalarUpdateFields) =>
  personService.updatePerson(input);

export const deletePerson = (id: string) => personService.deletePerson(id);
