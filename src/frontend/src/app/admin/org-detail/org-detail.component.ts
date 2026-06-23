import { Component, inject, signal } from "@angular/core";
import { NgStyle } from "@angular/common";
import { ActivatedRoute } from '@angular/router';
import { OrgService } from '../../core/services/org-service/org-service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DS } from '../../tokens';
import { BtnComponent } from '../../shared/btn.component';

@Component({
  selector: 'app-admin-org-detail',
  standalone: true,
  imports: [NgStyle, FormsModule, BtnComponent],
  templateUrl: './org-detail.component.html',
  styles: [`:host { display: block; flex: 1; min-height: 0; width: 100%; }`],
})
export class AdminOrgDetailComponent {
  private route = inject(ActivatedRoute)
  private orgService = inject(OrgService)
  private router = inject(Router)
  private http = inject(HttpClient)
  private orgBase = '/api/org'
  private authBase = '/api/auth'

  org = signal<any | null>(null)
  members = signal<any[]>([])
  allowedEmails = signal<any[]>([])
  busy = signal(false)
  removingId = signal<number | null>(null)
  removingInviteId = signal<number | null>(null)
  changingRoleId = signal<number | null>(null)

  email: string = ''
  csvText: string = ''
  singleNotice: string = ''
  bulkNotice: string = ''
  removeNotice: string = ''
  inviteNotice: string = ''
  roleNotice: string = ''

  pendingRoles: Record<number, string> = {}
  readonly validRoles = ['Admin', 'Bocal', 'Student']

  constructor(){ this.load() }

  load(){
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if(!id) return
    this.orgService.getOrg(id).subscribe({ next: (o:any)=> this.org.set(o) })
    this.orgService.listOrgMembers(id).subscribe({ next: (m:any[])=> {
      this.members.set(m || [])
      this.pendingRoles = Object.fromEntries((m || []).map((mem: any) => [mem.id, mem.role]))
    }})
    this.loadAllowedEmails()
  }

  loadAllowedEmails(){
    this.http.get<any[]>(`${this.authBase}/invites`).subscribe({
      next: (invites:any[]) => this.allowedEmails.set(invites || []),
    })
  }

  goBack() {
    this.router.navigate(['/admin/orgs'])
  }

  addOne(){
    const email = this.email.trim()
    this.singleNotice = ''
    if(!email) { this.singleNotice = 'Email required'; return }
    if(!this.validateEmail(email)) { this.singleNotice = 'Invalid email format'; return }
    this.busy.set(true)
    this.http.post(`${this.authBase}/invite`, { email }).subscribe({
      next: ()=>{
        this.busy.set(false)
        this.email = ''
        this.singleNotice = `Whitelisted ${email}`
        this.load()
      },
      error: (err)=>{
        this.busy.set(false)
        this.singleNotice = err?.error?.error ?? 'Failed to whitelist email'
      }
    })
  }

  revokeInvite(invite: any) {
    const id = Number(invite?.id)
    const email = String(invite?.email ?? '').trim()
    if (!id || !email) {
      this.inviteNotice = 'Missing invite details'
      return
    }

    if (!confirm(`Remove ${email} from the whitelist?`)) return

    this.removingInviteId.set(id)
    this.inviteNotice = ''

    this.http.delete(`${this.authBase}/invite/${id}`).subscribe({
      next: () => {
        this.removingInviteId.set(null)
        this.inviteNotice = `Removed ${email}`
        this.loadAllowedEmails()
      },
      error: () => {
        this.removingInviteId.set(null)
        this.inviteNotice = `Failed to remove ${email}`
      },
    })
  }

  removeMember(member: any) {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    const email = String(member?.email ?? '').trim()
    if (!email) {
      this.removeNotice = 'Missing member email'
      return
    }

    const label = member?.username ? `${member.username} <${email}>` : email
    if (!confirm(`Remove ${label} from this organization?`)) return

    this.removingId.set(member.id)
    this.removeNotice = ''

    this.http.delete(`${this.orgBase}/${id}/members`, { body: { email } }).subscribe({
      next: () => {
        this.removingId.set(null)
        this.removeNotice = `Removed ${label}`
        this.load()
      },
      error: () => {
        this.removingId.set(null)
        this.removeNotice = `Failed to remove ${label}`
      },
    })
  }

  changeRole(member: any) {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    const newRole = this.pendingRoles[member.id]
    if (!newRole || newRole === member.role) return
    this.changingRoleId.set(member.id)
    this.roleNotice = ''
    this.http.patch(`${this.orgBase}/${id}/members`, { email: member.email, role: newRole }).subscribe({
      next: () => {
        this.changingRoleId.set(null)
        this.roleNotice = `Updated ${member.username ?? member.email} to ${newRole}`
        this.load()
      },
      error: (err) => {
        this.changingRoleId.set(null)
        this.roleNotice = err?.error?.error ?? 'Failed to update role'
      },
    })
  }

  importCSV(){
    const lines = this.csvText.split('\n').map(l=>l.trim()).filter(Boolean)
    this.bulkNotice = ''
    if(lines.length === 0) { this.bulkNotice = 'No rows'; return }
    this.busy.set(true)
    const valid = lines.filter(l=>this.validateEmail(l))
    const invalidCount = lines.length - valid.length
    const promises = valid.map((email) => new Promise<{ email: string; ok: boolean }>((resolve)=>{
      this.http.post(`${this.authBase}/invite`, { email }).subscribe({ next: ()=>resolve({ email, ok:true }), error: ()=>resolve({ email, ok:false }) })
    }))
    Promise.all(promises).then((results)=>{
      const added = results.filter((result) => result.ok).length
      const failed = results.filter((result) => !result.ok).length
      this.busy.set(false)
      this.bulkNotice = `${added} whitelisted, ${failed} failed${invalidCount?`, ${invalidCount} invalid format` : ''}`
      this.csvText = ''
      this.loadAllowedEmails()
    })
  }

  validateEmail(email: string){
    return /.+@.+\..+/.test(String(email || ''))
  }

  formatInviteDate(value: string | Date | null | undefined) {
    const date = new Date(value ?? '')
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
  }

  readonly pageStyle = {
    padding: '32px',
    minHeight: '100%',
    minWidth: '0',
    height: '100%',
    overflowY: 'auto',
    background:
      'radial-gradient(circle at top right, oklch(22% 0.08 296 / 0.35), transparent 32%), radial-gradient(circle at top left, oklch(20% 0.05 200 / 0.28), transparent 28%), linear-gradient(180deg, oklch(11% 0.025 272), oklch(13% 0.025 272))',
    color: DS.colors.fg1,
  }

  readonly shellStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  }

  readonly heroStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '24px',
  }

  readonly eyebrowStyle = {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: DS.colors.cyan,
    marginBottom: '8px',
  }

  readonly titleStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.04em',
    color: DS.colors.fg1,
    margin: '0',
  }

  readonly subtitleStyle = {
    maxWidth: '720px',
    marginTop: '10px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: DS.colors.fg2,
  }

  readonly statGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
  }

  readonly statCardStyle = {
    background: DS.colors.surface,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.lg,
    padding: '18px 20px',
    boxShadow: '0 18px 40px oklch(0% 0 0 / 0.18)',
  }

  readonly statLabelStyle = {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: DS.colors.fg3,
    marginBottom: '8px',
  }

  readonly statValueStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '1.7rem',
    fontWeight: '700',
    color: DS.colors.fg1,
    lineHeight: '1',
  }

  readonly statHintStyle = {
    marginTop: '6px',
    fontSize: '0.8rem',
    color: DS.colors.fg3,
  }

  readonly cardStyle = {
    background: `linear-gradient(180deg, ${DS.colors.surface}, ${DS.colors.surfaceRaised})`,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl,
    padding: '18px 20px',
    boxShadow: '0 16px 44px oklch(0% 0 0 / 0.18)',
  }

  readonly sectionTitleStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '1.15rem',
    fontWeight: '700',
    color: DS.colors.fg1,
    margin: '0 0 8px',
  }

  readonly sectionHintStyle = {
    color: DS.colors.fg2,
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '18px',
  }

  readonly tableWrapStyle = {
    background: DS.colors.surface,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    boxShadow: '0 18px 40px oklch(0% 0 0 / 0.18)',
  }

  readonly tableHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.7fr 1.8fr',
    gap: '12px',
    padding: '14px 20px',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: DS.colors.fg3,
    borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    background: 'oklch(16% 0.025 272)',
  }

  readonly tableRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.7fr 1.8fr',
    gap: '12px',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    color: DS.colors.fg2,
  }

  readonly selectStyle = {
    background: DS.colors.surfaceRaised,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.md,
    padding: '4px 8px',
    fontSize: '0.85rem',
    fontFamily: DS.fonts.body,
    color: DS.colors.fg1,
    outline: 'none',
    cursor: 'pointer',
  }

  readonly inviteTableHeaderStyle = {
    ...this.tableHeaderStyle,
    gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr auto',
  }

  readonly inviteTableRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr auto',
    gap: '12px',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    color: DS.colors.fg2,
  }

  readonly emptyStateStyle = {
    border: `1px dashed ${DS.colors.border}`,
    borderRadius: DS.radius.lg,
    background: DS.colors.surface,
    padding: '18px 20px',
    color: DS.colors.fg2,
  }

  readonly labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    color: DS.colors.fg2,
    marginBottom: '8px',
  }

  readonly inputStyle = {
    background: DS.colors.surfaceRaised,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.md,
    padding: '10px 12px',
    fontSize: '0.9rem',
    fontFamily: DS.fonts.body,
    color: DS.colors.fg1,
    outline: 'none',
    width: '100%',
  }

  readonly textareaStyle = {
    ...this.inputStyle,
    minHeight: '124px',
    resize: 'vertical',
  }

  readonly roleCellStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  }

  readonly pillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: DS.radius.full,
    background: DS.colors.violetSubtle,
    color: DS.colors.violet,
    border: `1px solid ${DS.colors.violetBorder}`,
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    width: 'fit-content',
  }

  readonly badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: DS.radius.full,
    background: DS.colors.cyanSubtle,
    color: DS.colors.cyan,
    border: `1px solid ${DS.colors.cyanBorder}`,
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    width: 'fit-content',
  }

  readonly noticeStyle = {
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: DS.radius.md,
    border: `1px solid ${DS.colors.greenBorder}`,
    background: DS.colors.greenSubtle,
    color: DS.colors.green,
    fontSize: '0.875rem',
  }

  readonly errorStyle = {
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: DS.radius.md,
    border: `1px solid ${DS.colors.redBorder}`,
    background: DS.colors.redSubtle,
    color: DS.colors.red,
    fontSize: '0.875rem',
  }
}
