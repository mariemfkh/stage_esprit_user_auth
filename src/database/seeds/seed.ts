/**
 * Seed Script — ms-auth
 * Initialise les utilisateurs par défaut pour la plateforme CODE DESK.
 *
 * Usage: npm run seed
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../../users/enums/role.enum';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/ms_auth_dev';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: RoleEnum, required: true },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
});

const UserModel = mongoose.model('User', UserSchema);

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱 Connexion à MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  // 1. Default admin user
  console.log("👤 Création de l'admin par défaut...");
  const hashedPassword = await bcrypt.hash('Admin@CodeDesk2024!', 12);
  await UserModel.findOneAndUpdate(
    { email: 'admin@codedesk.local' },
    {
      firstName: 'Admin',
      lastName: 'CODE DESK',
      email: 'admin@codedesk.local',
      password: hashedPassword,
      role: RoleEnum.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
    { upsert: true, new: true },
  );
  console.log(
    '  ✓ admin@codedesk.local (mot de passe: Admin@CodeDesk2024!, rôle: super_admin)',
  );

  console.log('\n🎉 Seed terminé avec succès !');
  void mongoose.disconnect().finally(() => process.exit(0));
}

seed().catch((err: Error) => {
  console.error('❌ Erreur pendant le seed:', err.message);
  void mongoose.disconnect().finally(() => process.exit(1));
});
