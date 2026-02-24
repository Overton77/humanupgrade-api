import {
  buildOrgUpdateCypher,
  returnUpdatedOrganizationCypher,
} from "./updateOrganizationStatements.js";
import {
  buildOrgUpsertCypher,
  returnOrganizationsCypher,
} from "./createOrganizationStatements.js";
import {
  organizationHasLocationCypher,
  updateOrganizationHasLocationCypher,
} from "./organizationHasLocationStatements.js";
import {
  organizationOwnsOrControlsCypher,
  updateOrganizationOwnsOrControlsCypher,
} from "./organizationOwnsOrControlsStatements.js";
import {
  organizationListsCypher,
  updateOrganizationListsCypher,
} from "./organizationListsListingStatements.js";
import {
  organizationOffersProductCypher,
  updateOrganizationOffersProductCypher,
} from "./organizationOffersProductStatements.js";
import {
  organizationSuppliesCompoundFormCypher,
  updateOrganizationSuppliesCompoundFormCypher,
} from "./organizationSuppliesStatements.js";

import {
  updateOrganizationManufacturesCompoundFormCypher,
  updateOrganizationManufacturesProductCypher,
  updateOrganizationPerformsManufacturingProcessCypher,
  organizationManufacturesCompoundFormCypher,
  organizationManufacturesProductCypher,
  organizationPerformsManufacturingProcessCypher,
} from "./organizationManufacturesStatements.js";
import {
  updateOrganizationDevelopsPlatformCypher,
  updateOrganizationUsesPlatformCypher,
  organizationDevelopsPlatformCypher,
  organizationUsesPlatformCypher,
} from "./organizationTechnologyPlatformStatements.js";
import {
  updateOrganizationContractManufacturerForCompoundFormCypher,
  updateOrganizationContractManufacturerForOrganizationCypher,
  updateOrganizationContractManufacturerForProductCypher,
  organizationContractManufacturerForOrganizationCypher,
  organizationContractManufacturerForProductCypher,
  organizationContractManufacturerForCompoundFormCypher,
} from "./organizationContractsStatements.js";
import {
  organizationEmploysCypher,
  organizationFoundedByCypher,
  organizationHasBoardMemberCypher,
  organizationHasScientificAdvisorCypher,
  organizationHasExecutiveRoleCypher,
  updateOrganizationEmploysCypher,
  updateOrganizationFoundedByCypher,
  updateOrganizationHasBoardMemberCypher,
  updateOrganizationHasScientificAdvisorCypher,
  updateOrganizationHasExecutiveRoleCypher,
} from "./organizationPeopleStatements.js";

export const updateOrganizationStatements = {
  buildOrgUpdateCypher,
  updateOrganizationHasLocationCypher,
  updateOrganizationOwnsOrControlsCypher,
  updateOrganizationListsCypher,
  updateOrganizationOffersProductCypher,
  updateOrganizationSuppliesCompoundFormCypher,
  updateOrganizationManufacturesCompoundFormCypher,
  updateOrganizationManufacturesProductCypher,
  updateOrganizationContractManufacturerForOrganizationCypher,
  updateOrganizationContractManufacturerForProductCypher,
  updateOrganizationContractManufacturerForCompoundFormCypher,
  updateOrganizationPerformsManufacturingProcessCypher,
  updateOrganizationDevelopsPlatformCypher,
  updateOrganizationUsesPlatformCypher,
  updateOrganizationEmploysCypher,
  updateOrganizationFoundedByCypher,
  updateOrganizationHasBoardMemberCypher,
  updateOrganizationHasScientificAdvisorCypher,
  updateOrganizationHasExecutiveRoleCypher,
  returnUpdatedOrganizationCypher,
};

export const createOrganizationStatements = {
  buildOrgUpsertCypher,
  organizationHasLocationCypher,
  organizationOwnsOrControlsCypher,
  organizationListsCypher,
  organizationOffersProductCypher,
  organizationSuppliesCompoundFormCypher,
  organizationManufacturesCompoundFormCypher,
  organizationManufacturesProductCypher,
  organizationContractManufacturerForOrganizationCypher,
  organizationContractManufacturerForProductCypher,
  organizationContractManufacturerForCompoundFormCypher,
  organizationPerformsManufacturingProcessCypher,
  organizationDevelopsPlatformCypher,
  organizationUsesPlatformCypher,
  organizationEmploysCypher,
  organizationFoundedByCypher,
  organizationHasBoardMemberCypher,
  organizationHasScientificAdvisorCypher,
  organizationHasExecutiveRoleCypher,
  returnOrganizationsCypher,
};
