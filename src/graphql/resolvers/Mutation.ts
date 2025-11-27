import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { Episode } from "../../models/Episode";
import { Product } from "../../models/Product";
import { Business } from "../../models/Business";
import { Person } from "../../models/Person";
import { signAuthToken } from "../../services/auth";
import {
  createBusinessWithOptionalIds,
  updateBusinessWithOptionalIds,
  updateBusinessWithRelationFields,
} from "../../services/businessService";
import {
  BusinessCreateWithOptionalIdsInput,
  BusinessUpdateWithOptionalIdsInput,
  BusinessUpdateRelationFieldsInput,
} from "../inputs/businessInputs";
import {
  createProductWithOptionalIds,
  updateProductWithOptionalIds,
  updateProductWithRelationFields,
} from "../../services/productService";
import {
  ProductCreateWithOptionalIdsInput,
  ProductUpdateWithOptionalIdsInput,
  ProductUpdateRelationFieldsInput,
} from "../inputs/productInputs";
import {
  createPersonWithOptionalIds,
  updatePersonWithOptionalIds,
  updatePersonWithRelationFields,
} from "../../services/personService";
import {
  PersonCreateWithOptionalIdsInput,
  PersonUpdateWithOptionalIdsInput,
  PersonUpdateRelationFieldsInput,
} from "../inputs/personInputs";

const SALT_ROUNDS = 10;

export const Mutation = {
  register: async (
    _parent: unknown,
    args: { email: string; password: string; name?: string }
  ) => {
    const existing = await User.findOne({ email: args.email });
    if (existing) {
      throw new Error("Email already in use");
    }

    const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS);

    const user = await User.create({
      email: args.email,
      passwordHash,
      provider: "local",
      name: args.name,
    });

    const token = signAuthToken({ userId: user._id.toString() });

    return { token, user };
  },

  login: async (
    _parent: unknown,
    args: { email: string; password: string }
  ) => {
    const user = await User.findOne({ email: args.email });
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const valid = await user.comparePassword(args.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    const token = signAuthToken({ userId: user._id.toString() });
    return { token, user };
  },

  toggleSaveEpisode: async (
    _parent: unknown,
    args: { episodeId: string },
    ctx: any
  ) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    const episode = await Episode.findById(args.episodeId);
    if (!episode) throw new Error("Episode not found");

    const user = ctx.user;
    const idx = user.savedEpisodes.findIndex(
      (id: any) => id.toString() === args.episodeId
    );
    if (idx >= 0) {
      user.savedEpisodes.splice(idx, 1);
    } else {
      user.savedEpisodes.push(episode._id);
    }
    await user.save();
    return user;
  },

  toggleSaveProduct: async (
    _parent: unknown,
    args: { productId: string },
    ctx: any
  ) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    const product = await Product.findById(args.productId);
    if (!product) throw new Error("Product not found");

    const user = ctx.user;
    const idx = user.savedProducts.findIndex(
      (id: any) => id.toString() === args.productId
    );
    if (idx >= 0) {
      user.savedProducts.splice(idx, 1);
    } else {
      user.savedProducts.push(product._id);
    }
    await user.save();
    return user;
  },

  toggleSaveBusiness: async (
    _parent: unknown,
    args: { businessId: string },
    ctx: any
  ) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    const business = await Business.findById(args.businessId);
    if (!business) throw new Error("Business not found");

    const user = ctx.user;
    const idx = user.savedBusinesses.findIndex(
      (id: any) => id.toString() === args.businessId
    );
    if (idx >= 0) {
      user.savedBusinesses.splice(idx, 1);
    } else {
      user.savedBusinesses.push(business._id);
    }
    await user.save();
    return user;
  },
  createBusiness: async (
    _parent: unknown,
    args: { input: BusinessCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    // args.input shape matches BusinessCreateWithOptionalIdsInput
    const business = await createBusinessWithOptionalIds(args.input);
    return business;
  },

  updateBusiness: async (
    _parent: unknown,
    args: { input: BusinessUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const business = await updateBusinessWithOptionalIds(args.input);
    return business;
  },

  updateBusinessRelations: async (
    _parent: unknown,
    args: { input: BusinessUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const business = await updateBusinessWithRelationFields(args.input);
    return business;
  },

  // --- Product mutations ---

  createProduct: async (
    _parent: unknown,
    args: { input: ProductCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const product = await createProductWithOptionalIds(args.input);
    return product;
  },

  updateProduct: async (
    _parent: unknown,
    args: { input: ProductUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const product = await updateProductWithOptionalIds(args.input);
    return product;
  },

  updateProductRelations: async (
    _parent: unknown,
    args: { input: ProductUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const product = await updateProductWithRelationFields(args.input);
    return product;
  },

  // --- Person mutations ---

  createPerson: async (
    _parent: unknown,
    args: { input: PersonCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const person = await createPersonWithOptionalIds(args.input);
    return person;
  },

  updatePerson: async (
    _parent: unknown,
    args: { input: PersonUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const person = await updatePersonWithOptionalIds(args.input);
    return person;
  },

  updatePersonRelations: async (
    _parent: unknown,
    args: { input: PersonUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const person = await updatePersonWithRelationFields(args.input);
    return person;
  },
};
